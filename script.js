// access the canvas from html
const canvas= document.querySelector("#waveform");
const ctx=canvas.getContext("2d");

// defining fucntion for reference line
function referenceLine(){
    ctx.beginPath();   // starts the shape
    ctx.moveTo(10,150);   // takes the pointer to postion from where you want to start the line 
    ctx.lineTo(590, 150);
    ctx.strokeStyle="black";
    ctx.lineWidth=2;
    ctx.stroke();  // renders the line or waveform 
}

// defining function to scale actual Ia Ib Ic to fit in canvas reasonably 
function scaleValue(value, orgMin, orgMax, newMin, newMax){
    let scaledVal= ((value - orgMin)/(orgMax - orgMin))* (newMax - newMin) + newMin;
    return scaledVal;
}

// radio buttons and their fuction
const btnAbout = document.querySelector("#btnAbout");
const btnValue = document.querySelector("#btnValue");
const aboutTab = document.querySelector("#aboutTab");
const valueTab = document.querySelector("#valueTab");

btnAbout.addEventListener("change", () => {
    aboutTab.style.display = "block";
    valueTab.style.display = "none";
});

btnValue.addEventListener("change", () => {
    aboutTab.style.display = "none";
    valueTab.style.display = "block";
});

// reading Input values from UI

const IaSlider= document.querySelector("#Ia");
const IbSlider= document.querySelector("#Ib");
const IcSlider= document.querySelector("#Ic");
const VaSlider= document.querySelector("#Va");
const VbSlider= document.querySelector("#Vb");
const VcSlider= document.querySelector("#Vc");

// adding actions to input values
IaSlider.addEventListener("input", ()=>{
    console.log("I am inside Ia event listener!");
    let IaVal=parseFloat(IaSlider.value);
    let IbVal=parseFloat(IbSlider.value);
    let IcVal=parseFloat(IcSlider.value);
    let VaVal=parseFloat(VaSlider.value);
    let VbVal=parseFloat(VbSlider.value);
    let VcVal=parseFloat(VcSlider.value);
    console.log(IaVal);
    updateSineWave(IaVal, IbVal, IcVal);
    getPredictions(IaVal, IbVal, IcVal, VaVal, VbVal, VcVal);
    document.querySelector("#IaDisplay").textContent=IaVal;
});

IbSlider.addEventListener("input", ()=>{
    console.log("I am inside Ib event listener!");
    let IaVal=parseFloat(IaSlider.value);
    let IbVal=parseFloat(IbSlider.value);
    let IcVal=parseFloat(IcSlider.value);
    let VaVal=parseFloat(VaSlider.value);
    let VbVal=parseFloat(VbSlider.value);
    let VcVal=parseFloat(VcSlider.value);
    console.log(IbVal);
    updateSineWave(IaVal, IbVal, IcVal);
    getPredictions(IaVal, IbVal, IcVal, VaVal, VbVal, VcVal);
    document.querySelector("#IbDisplay").textContent=IbVal;
});

IcSlider.addEventListener("input", ()=>{
    console.log("I am inside Ic event listener!");
    let IaVal=parseFloat(IaSlider.value);
    let IbVal=parseFloat(IbSlider.value);
    let IcVal=parseFloat(IcSlider.value);
    let VaVal=parseFloat(VaSlider.value);
    let VbVal=parseFloat(VbSlider.value);
    let VcVal=parseFloat(VcSlider.value);
    console.log(IcVal);
    updateSineWave(IaVal, IbVal, IcVal);
    getPredictions(IaVal, IbVal, IcVal, VaVal, VbVal, VcVal);
    document.querySelector("#IcDisplay").textContent=IcVal;
});

VaSlider.addEventListener("input", ()=>{
    console.log("I am inside Va event listener!");
    let IaVal=parseFloat(IaSlider.value);
    let IbVal=parseFloat(IbSlider.value);
    let IcVal=parseFloat(IcSlider.value);
    let VaVal=parseFloat(VaSlider.value);
    let VbVal=parseFloat(VbSlider.value);
    let VcVal=parseFloat(VcSlider.value);
    console.log(VaVal);
    getPredictions(IaVal, IbVal, IcVal, VaVal, VbVal, VcVal);
    document.querySelector("#VaDisplay").textContent=VaVal;
});

VbSlider.addEventListener("input", ()=>{
    console.log("I am inside Vb event listener!");
    let IaVal=parseFloat(IaSlider.value);
    let IbVal=parseFloat(IbSlider.value);
    let IcVal=parseFloat(IcSlider.value);
    let VaVal=parseFloat(VaSlider.value);
    let VbVal=parseFloat(VbSlider.value);
    let VcVal=parseFloat(VcSlider.value);
    console.log(VbVal);
    getPredictions(IaVal, IbVal, IcVal, VaVal, VbVal, VcVal);
    document.querySelector("#VbDisplay").textContent=VbVal;
});

VcSlider.addEventListener("input", ()=>{
    console.log("I am inside Vc event listener!");
    let IaVal=parseFloat(IaSlider.value);
    let IbVal=parseFloat(IbSlider.value);
    let IcVal=parseFloat(IcSlider.value);
    let VaVal=parseFloat(VaSlider.value);
    let VbVal=parseFloat(VbSlider.value);
    let VcVal=parseFloat(VcSlider.value);
    console.log(VcVal);
    getPredictions(IaVal, IbVal, IcVal, VaVal, VbVal, VcVal);
    document.querySelector("#VcDisplay").textContent=VcVal;
});

// adding eventListener for reset to default button logic
document.querySelector("#resetBtn").addEventListener("click", () => {
    IaSlider.value = 200;
    IbSlider.value = 200;
    IcSlider.value = 200;
    VaSlider.value = 0.1;
    VbSlider.value = 0.1;
    VcSlider.value = 0.1;

    document.querySelector("#IaDisplay").textContent = 200;
    document.querySelector("#IbDisplay").textContent = 200;
    document.querySelector("#IcDisplay").textContent = 200;
    document.querySelector("#VaDisplay").textContent = 0.1;
    document.querySelector("#VbDisplay").textContent = 0.1;
    document.querySelector("#VcDisplay").textContent = 0.1;

    updateSineWave(200, 200, 200);
    getPredictions(200, 200, 200, 0.1, 0.1, 0.1);
});



// defining the function for sinewave-- draws only 1 sinewave
function sineWave(ctx, amplitude, frequency, phaseShift, color, centerY, width){
    ctx.beginPath();
    for (let x=0; x<width; x++){
        const y= centerY - amplitude * Math.sin((x*frequency) + phaseShift);
        // - sign is used bcz Y increades downwards here
        // frequency is used to make waveform looks better else it would be very messy n dense like 100 cycles on a 600 width canvas
        // phaseshift is angle value (120 degree) in radians 2.049 (240 deg= 4.189)
        if (x===0){
            ctx.moveTo(x+10,y);
        } else {
            ctx.lineTo(x+10,y)
        }
    }
    ctx.strokeStyle= color;
    ctx.lineWidth=2;
    ctx.stroke();
}


// defining the function updateSineWave -- actual function executes all time
function updateSineWave(IaVal, IbVal, IcVal){
    // clear the previous sinewave explicitly
    ctx.clearRect(0,0, canvas.width, canvas.height);

    
    // calling scaleValue function before printing the sinewave
    // Ia, Ib, Ic will come from addevent listener
    scaledIa= scaleValue(IaVal, -450, 450, -150, 150) // -450, 450, -150, 150
    scaledIb= scaleValue(IbVal, -450, 450, -150, 150)
    scaledIc= scaleValue(IcVal, -450, 450, -150, 150)


    // calling all 3 sinewaves and reference line again
    referenceLine()
    sineWave(ctx, scaledIa, 0.03, 0, "red", 150, 580); // phase A
    sineWave(ctx, scaledIb, 0.03, 2.049, "green", 150, 580); // phase B 
    sineWave(ctx, scaledIc, 0.03, 4.189, "blue", 150, 580); // phase C

}



// calling the update function -- it will run only once at start showing default sinewave
updateSineWave(200, 200, 200);



//========================== Backend Part fetch API ===================================

// writing the fetch function with  async/await mode

async function getPredictions(IaVal, IbVal, IcVal, VaVal, VbVal, VcVal) {
    const response = await fetch("https://phaseguard-api.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type" : "application/json"},
        body: JSON.stringify({
            Ia: IaVal,
            Ib: IbVal,
            Ic: IcVal,
            Va: VaVal,
            Vb: VbVal,
            Vc: VcVal
        })

    });
    const data = await response.json();
    console.log(data);
    document.querySelector("#FaultType").textContent=data.fault_type;
    document.querySelector("#FaultLabel").textContent=data.fault_label;
    document.querySelector("#ConfValue").textContent=(data.confidence * 100).toFixed(1) + "%";
    document.querySelector("#PhA").textContent="Phase A: " + (data.phase_status.A ? "Faulted" : "Healthy");
    document.querySelector("#PhA").className = data.phase_status.A ? "pill faulted" : "pill healthy";

    document.querySelector("#PhB").textContent="Phase B: " + (data.phase_status.B ? "Faulted" : "Healthy");
    document.querySelector("#PhB").className = data.phase_status.B ? "pill faulted" : "pill healthy";

    document.querySelector("#PhC").textContent="Phase C: " + (data.phase_status.C ? "Faulted" : "Healthy");
    document.querySelector("#PhC").className = data.phase_status.C ? "pill faulted" : "pill healthy";

    document.querySelector("#PhG").textContent="Ground: " + (data.phase_status.ground ? "Faulted" : "Healthy");
    document.querySelector("#PhG").className = data.phase_status.ground ? "pill faulted" : "pill healthy";

};

// calling the function 
getPredictions(200, 200, 200, 0.1, 0.1, 0.1);