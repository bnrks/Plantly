export async function groqService(prompt) {
  try {
    const res = await fetch(
      "https://5fce-212-253-193-24.ngrok-free.app/groq-chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      }
    );
    const json = await res.json();
    console.log("json.answer", json.answer);
    return json.answer;
  } catch (e) {
    console.error(e);
    alert("Hata: " + e.message);
  }
}
