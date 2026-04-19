import warnings
warnings.filterwarnings("ignore", module="google")
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import engine, SessionLocal
from models import Base, Competition, Agent, CompetitionParticipant, Submission, Leaderboard, Rewards
import time
import threading
from datetime import datetime, timezone
import requests
import vertexai
from supabase import create_client
from vertexai.preview.vision_models import ImageGenerationModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# create tables (safe)
Base.metadata.create_all(bind=engine)


class CreateCompetitionRequest(BaseModel):
    title: str
    prompt: str
    max_iterations: int
    min_agents: int
    duration: int = 60


class JoinCompetitionRequest(BaseModel):
    agent_id: int


class SubmitOutputRequest(BaseModel):
    competition_id: int
    agent_id: int
    image_url: str

#judge agent by OpenRouter API
def get_score_from_ai(prompt, image_url):
    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": "Bearer Token_here",
                "Content-Type": "application/json"
            },
            json={
                "model": "google/gemma-3-4b-it",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": f"Rate this image from 1 to 10 and give a detailed reason.\nReturn format: score: <number>, reason: <text>\nPrompt: {prompt}"
                            },
                            {
                                "type": "image_url",
                                "image_url": image_url   
                            }
                        ]
                    }
                ]
            },
            timeout=10
        )

        result = response.json()
        print("DEBUG:", result)  
        if "choices" not in result:
             return {"score": 5.0, "reason": "default"}
        text = result["choices"][0]["message"]["content"]
        parts = text.split(",")
        score = float(parts[0].split(":")[1].strip())
        reason = parts[1].split(":")[1].strip()

        return {"score": score, "reason": reason}

    except Exception as e:
        print("ERROR:", e)
        return {"score": 5.0, "reason": "error"}
    
# upload to supabase
url = "url_here"
key = "key_here"
supabase = create_client(url, key)

#mock_agent execution
def run_mock_agents(competition_id):
    db = SessionLocal()
    try:

        comp = db.query(Competition).filter(Competition.id == competition_id).first()
        participants = db.query(CompetitionParticipant).filter(
            CompetitionParticipant.competition_id == competition_id
        ).all()

        for p in participants:
            agent_id = p.agent_id

            for i in range(comp.max_iterations):   # multi-iteration added
                image_url = generate_image_from_vertex(comp.prompt)

                sub = Submission(
                    competition_id=competition_id,
                    agent_id=agent_id,
                    image_url=image_url,
                    iteration_number=i+1
                )
                db.add(sub)

        db.commit()
    finally:
        db.close()

#Add image generation

def generate_image_from_vertex(prompt):
    vertexai.init(project="aicompetitionplatformagents", location="us-central1")

    model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-002")
    images = model.generate_images(prompt=prompt)

    image_bytes = images[0]._image_bytes

    file_name = f"temp_{int(time.time())}.png"
    supabase.storage.from_("images").upload(
        file_name,
        image_bytes,
        {"content-type": "image/png"}
    )

    public_url = supabase.storage.from_("images").get_public_url(file_name)

    return public_url

#Agent apis
@app.post("/agent/register")
def register_agent(name: str):
    db = SessionLocal()
    try:
        agent = Agent(name=name)
        db.add(agent)
        db.commit()
        return {"msg": "agent created"}
    finally:
        db.close()

@app.post("/agent/login")
def login_agent(id: int):
    db = SessionLocal()
    try:
        agent = db.query(Agent).filter(Agent.id == id).first()
        return {"msg": "login success" if agent else "not found"}
    finally:
        db.close()

#Competition apis

@app.post("/competition/create")
def create_competition(payload: CreateCompetitionRequest):
    db=SessionLocal()
    try:
        new_comp = Competition(
            title=payload.title,
            prompt=payload.prompt,
            max_iterations=payload.max_iterations,
            min_agents=payload.min_agents,
            duration=payload.duration
            
        )
        db.add(new_comp)
        db.commit()
        db.refresh(new_comp)
        return {
            "msg": "Competition created",
            "id": new_comp.id,
            "title": new_comp.title,
            "prompt": new_comp.prompt,
            "max_iterations": new_comp.max_iterations,
            "min_agents": new_comp.min_agents,
            "participant_count": 0,
            "status": new_comp.status,
            "created_at": new_comp.created_at,
        }
    finally:
        db.close()

@app.get("/competitions")
def get_competitions():
    db=SessionLocal()
    try:
        data=db.query(Competition).all()
        return [
            {
                "id": c.id,
                "title": c.title,
                "prompt": c.prompt,
                "max_iterations": c.max_iterations,
                "min_agents": c.min_agents,
                "participant_count": db.query(CompetitionParticipant).filter(CompetitionParticipant.competition_id == c.id).count(),
                "status": c.status,
                "created_at": c.created_at
            }
            for c in data
        ]
    finally:
        db.close()
@app.get("/competition/{id}")
def get_competition_by_id(id: int):
    db=SessionLocal()
    try:
        data=db.query(Competition).filter(Competition.id==id).first()
        if not data:
            raise HTTPException(status_code=404, detail="Competition not found")

        return {
            "id": data.id,
            "title": data.title,
            "prompt": data.prompt,
            "max_iterations": data.max_iterations,
            "min_agents": data.min_agents,
            "participant_count": db.query(CompetitionParticipant).filter(CompetitionParticipant.competition_id == data.id).count(),
            "status": data.status,
            "created_at": data.created_at
        }
    finally:
        db.close()
@app.post("/competition/{id}/join")
def join_competition(id: int, payload: JoinCompetitionRequest):
    db = SessionLocal()
    try:
        competition = db.query(Competition).filter(Competition.id == id).first()
        if not competition:
            raise HTTPException(status_code=404, detail="Competition not found")

        existing_participant = db.query(CompetitionParticipant).filter(
            CompetitionParticipant.competition_id == id,
            CompetitionParticipant.agent_id == payload.agent_id
        ).first()
        if existing_participant:
            return {"msg": "already joined"}

        joined_count = db.query(CompetitionParticipant).filter(
            CompetitionParticipant.competition_id == id
        ).count()
        if joined_count >= competition.min_agents:
            raise HTTPException(status_code=400, detail="competition full")

        agent = db.query(Agent).filter(Agent.id == payload.agent_id).first()
        if not agent:
            agent = Agent(id=payload.agent_id, name=f"Agent {payload.agent_id}")
            db.add(agent)
            db.commit()

        cp = CompetitionParticipant(competition_id=id, agent_id=payload.agent_id)
        db.add(cp)
        db.commit()
        return {"msg": "joined"}
    finally:
        db.close()

#Submission apis

@app.post("/submit-output")
def submit_output(payload: SubmitOutputRequest):
    db = SessionLocal()
    try:
        sub = Submission(
            competition_id=payload.competition_id,
            agent_id=payload.agent_id,
            image_url=payload.image_url
        )
        db.add(sub)
        db.commit()
        return {"msg": "submitted"}
    finally:
        db.close()

@app.get("/competition/{id}/submissions")
def get_submissions(id: int):
    db = SessionLocal()
    try:
        data = db.query(Submission).filter(Submission.competition_id == id).all()
        return [
            {
                "agent_id": s.agent_id,
                "submission_id": s.id,
                "image_url": s.image_url,
                "score": s.score,
                "reason": s.reason,
            }
            for s in data
        ]
    finally:
        db.close()

#leaderboard apis
@app.get("/leaderboard/{competition_id}")
def leaderboard(competition_id: int):
    db = SessionLocal()
    try:
        data = db.query(Submission).filter(Submission.competition_id == competition_id).all()

        best_scores = {}

        for s in data:
            current_score = s.score if s.score is not None else 0
            best_score = (
                best_scores[s.agent_id]["score"]
                if s.agent_id in best_scores and best_scores[s.agent_id]["score"] is not None
                else 0
            )

            if s.agent_id not in best_scores or current_score > best_score:
                best_scores[s.agent_id] = {
                    "agent_id": s.agent_id,
                    "score": s.score,
                    "reason": s.reason
                }

        result = list(best_scores.values())

        return sorted(result, key=lambda x: x["score"] if x["score"] else 0, reverse=True)
    finally:
        db.close()

#Internal Apis(mock for now)
@app.post("/internal/start-competition/{id}")
def start_comp(id: int):
    db = SessionLocal()
    try:
        comp = db.query(Competition).filter(Competition.id == id).first()

        if not comp:
            return {"msg": "not found"}

        comp.status = "ongoing"
        db.commit()

        run_mock_agents(id)

        def run_later(comp_id, duration):
            time.sleep(duration)
            evaluate(comp_id)

        threading.Thread(target=run_later, args=(id, comp.duration)).start()

        return {"msg": "competition started"}
    finally:
        db.close()



@app.post("/internal/run-iteration")
def run_iter():
    return {"msg": "iteration run"}




@app.post("/internal/evaluate/{competition_id}")
def evaluate(competition_id: int):
    db = SessionLocal()
    try:

        comp = db.query(Competition).filter(Competition.id == competition_id).first()
        subs = db.query(Submission).filter(Submission.competition_id == competition_id).all()

        agent_best = {}

        for s in subs:
            result = get_score_from_ai(comp.prompt, s.image_url)
            s.score = result["score"]
            s.reason = result["reason"]

            if s.agent_id not in agent_best or s.score > agent_best[s.agent_id]:
                agent_best[s.agent_id] = s.score

        db.commit()
        return {"msg": "AI scoring done"}
    finally:
        db.close()

@app.post("/internal/distribute-rewards")
def rewards():
    return {"msg": "rewards distributed"}



@app.post("/internal/update-leaderboard/{competition_id}")
def update_leaderboard(competition_id: int):
    db = SessionLocal()
    try:

        subs = db.query(Submission).filter(Submission.competition_id == competition_id).all()

        best_scores = {}

        for s in subs:
            if s.agent_id not in best_scores or (s.score and s.score > best_scores[s.agent_id]):
                best_scores[s.agent_id] = s.score

        sorted_agents = sorted(best_scores.items(), key=lambda x: x[1] if x[1] else 0, reverse=True)

        rank = 1
        for agent_id, score in sorted_agents:
            entry = Leaderboard(
                competition_id=competition_id,
                agent_id=agent_id,
                final_score=score,
                rank=rank
            )
            db.add(entry)
            rank += 1

        db.commit()
        return {"msg": "leaderboard updated"}
    finally:
        db.close()




#health api

@app.get("/health")
def health():
    return {"status": "ok"}
