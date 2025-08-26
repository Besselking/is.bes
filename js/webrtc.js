import { writeDebug, writeError, writeInfo, getById } from "./common.js";

const ps = new RTCPeerConnection({});
ps.onicecandidate = (event) => {
    writeDebug("ICE candidate: " + JSON.stringify(event.candidate));
}
ps.oniceconnectionstatechange = (event) => {
    writeDebug("ICE state: " + ps.iceConnectionState);
}
ps.onconnectionstatechange = (event) => {
    writeDebug("Connection state: " + ps.connectionState);
}
ps.onsignalingstatechange = (event) => {
    writeDebug("Signaling state: " + ps.signalingState);
}
ps.onnegotiationneeded = async (event) => {
    writeDebug("Negotiation needed");
    try {
        const offer = await ps.createOffer();
        await ps.setLocalDescription(offer);
        writeDebug("Local description set");
        writeDebug("Offer: " + JSON.stringify(ps.localDescription));
    } catch (err) {
        writeError("Error during negotiation: " + err);
    }
}
ps.onicegatheringstatechange = (event) => {
    writeDebug("ICE gathering state: " + ps.iceGatheringState);
}


window.ps = ps;
writeDebug("RTCPeerConnection created");

async function createOffer() {
    const offer = await ps.createOffer();
    await ps.setLocalDescription(offer);
    writeInfo("Offer: " + JSON.stringify(offer));
}

const newOfferBtn = getById("newOffer");
newOfferBtn.addEventListener("click", async () => {
    try {
        await createOffer();
    } catch (err) {
        writeError("Error creating offer: " + err);
    }
});

const acceptOfferBtn = getById("acceptOffer");
acceptOfferBtn.addEventListener("click", async () => {
    const input = getById("input").value;
    let offer;
    try {
        offer = JSON.parse(input);
    } catch (err) {
        writeError("Error parsing offer: " + err);
        return;
    }
    if (!offer || !offer.type || !offer.sdp) {
        writeError("Invalid offer");
        return;
    }
    try {
        await ps.setRemoteDescription(offer);
        writeDebug("Remote description set");
        const answer = await ps.createAnswer();
        await ps.setLocalDescription(answer);
        writeInfo("Answer: " + JSON.stringify(answer));
    } catch (err) {
        writeError("Error accepting offer: " + err);
    }
});

const acceptAnswerBtn = getById("acceptAnswer");
acceptAnswerBtn.addEventListener("click", async () => {
    const input = getById("input").value;
    let answer;
    try {
        answer = JSON.parse(input);
    } catch (err) {
        writeError("Error parsing answer: " + err);
        return;
    }
    if (!answer || !answer.type || !answer.sdp) {
        writeError("Invalid answer");
        return;
    }
    try {
        await ps.setRemoteDescription(answer);
        writeDebug("Remote description set");
    } catch (err) {
        writeError("Error accepting answer: " + err);
    }
});