export async function groqService(prompt) {
  try {
    const res = await fetch(
      "https://learning-partially-rabbit.ngrok-free.app/groq-chat", // You should change this to your actual backend URL
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
