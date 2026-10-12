
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
import joblib



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_headers=["*"],
    allow_origins=["*"],
    allow_methods=["*"]
)

# get request
@app.get("/")
def read_root():
    return {"message": "PhaseGuard API is running successfully!"}

class FaultTypes(BaseModel):
    Ia: float
    Ib: float
    Ic: float
    Va: float
    Vb: float
    Vc: float

# post request -- test endpoint
# @app.post("/predict")
# def predict_result(data: FaultTypes):
#     return {"received": data}


# Loading the project model
model= joblib.load("phaseguard_model.pkl")

# defining the Fault information for UI (user understanding)
fault_info={
    "No Fault": {"label": "No Fault", "A": False, "B": False, "C": False, "ground": False},
    "AG": {"label": "Line A to Ground fault", "A": True, "B": False, "C": False, "ground": True},
    "BC": {"label": "Line B to Line C fault", "A": False, "B": True, "C": True, "ground": False},
    "ABG": {"label": "Line A,B to Ground fault", "A": True, "B": True, "C": False, "ground": True},
    "ABC": {"label": "Three-Phase fault", "A": True, "B": True, "C": True, "ground": False},
    "ABCG": {"label": "Three-Phase to Ground fault", "A": True, "B": True, "C": True, "ground": True}
}

# creating predict end point

@app.post("/predict")
def predict_result(data: FaultTypes):
    # definign input values coming from user (UI- JS)
    # this should be 2D array since sklearn expects 2D array
    input_vals=[[data.Ia, data.Ib, data.Ic, data.Va, data.Vb, data.Vc]]


    # geeting prediction and confidence score for user input
    prediction = model.predict(input_vals)[0]  #[0] will extract the exact value instead of list -- 'AG'
    probabilities = model.predict_proba(input_vals)[0] # Array of 2 probabilities
    confidence= max(probabilities)

    # getting the required dictionary according to fault type predicted
    info = fault_info[prediction]

    return {
        "fault_type": prediction,
        "fault_label": info["label"],
        "confidence" : round(float(confidence), 2),   # float-- converts numpy.float to float
        "phase_status": {
            "A": info["A"],
            "B": info["B"],
            "C": info["C"],
            "ground": info["ground"]
        }
    }

# if __name__=="__main__":
#   uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)