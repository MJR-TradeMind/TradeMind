(() => {
  const review = document.getElementById("review");
  if (!review || document.getElementById("bht-coach")) return;

  const oldPanel = review.querySelector(".panel");
  if (oldPanel) oldPanel.style.display = "none";

  const navButton = document.querySelector('[data-tab="review"]');
  if (navButton) navButton.textContent = "BHT AI Coach";

  const style = document.createElement("style");
  style.textContent = `
    #bht-coach {
      max-width: 1000px;
      margin: 0 auto;
      color: #eef2fa;
    }

    .bht-coach-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 18px;
    }

    .bht-coach-heading {
      display: flex;
      align-items: center;
      gap: 13px;
    }

    .bht-coach-icon {
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      border-radius: 14px;
      background: #1d3553;
      font-size: 25px;
    }

    .bht-coach-heading h2 {
      margin: 0 0 4px;
      font-size: 24px;
    }

    .bht-coach-heading p {
      margin: 0;
      color: #94a3b8;
      font-size: 13px;
    }

    .bht-coach-controls {
      display: flex;
      align-items: end;
      gap: 10px;
      flex-wrap: wrap;
    }

    .bht-coach-controls label {
      margin: 0;
    }

    .bht-coach-controls input {
      width: 170px;
      margin-top: 6px;
    }

    .bht-coach-chat {
      background: #101a2a;
      border: 1px solid #304158;
      border-radius: 17px;
      overflow: hidden;
    }

    .bht-coach-messages {
      height: 480px;
      overflow-y: auto;
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .bht-message {
      max-width: 85%;
      padding: 16px 18px;
      border-radius: 15px;
      line-height: 1.65;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font-size: 14px;
    }

    .bht-message.assistant {
      align-self: flex-start;
      background: #1b2b40;
      border: 1px solid #344b69;
    }

    .bht-message.user {
      align-self: flex-end;
      background: #1d4ed8;
      color: white;
    }

    .bht-message-label {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      margin-bottom: 9px;
      color: #93c5fd;
    }

    .bht-message.user .bht-message-label {
      color: #dbeafe;
    }

    .bht-coach-compose {
      display: flex;
      align-items: end;
      gap: 10px;
      padding: 15px;
      border-top: 1px solid #304158;
      background: #141f30;
    }

    #bht-coach-input {
      min-height: 55px;
      max-height: 150px;
      resize: vertical;
      flex: 1;
    }

    #bht-coach-send {
      background: #2563eb;
      border-color: #3b82f6;
      min-height: 55px;
    }

    .bht-coach-note {
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.6;
      margin-top: 12px;
    }

    .bht-coach-error {
      color: #fda4af;
      font-size: 13px;
      margin-top: 10px;
      white-space: pre-wrap;
    }

    @media (max-width: 650px) {
      .bht-coach-messages {
        height: 420px;
        padding: 12px;
      }

      .bht-message {
        max-width: 95%;
        padding: 13px;
      }

      .bht-coach-compose {
        padding: 10px;
      }
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement("div");
  container.id = "bht-coach";

  container.innerHTML = `
    <div class="bht-coach-header">
      <div class="bht-coach-heading">
        <div class="bht-coach-icon">🧠</div>
        <div>
          <h2>BHT AI Coach</h2>
          <p>Your personal trading accountability coach</p>
        </div>
      </div>

      <div class="bht-coach-controls">
        <label>
          Trading day
          <input type="date" id="bht-coach-date">
        </label>
        <button type="button" id="bht-coach-review">
          Review My Day
        </button>
        <button type="button" id="bht-coach-reset">
          New Chat
        </button>
      </div>
    </div>

    <div class="bht-coach-chat">
      <div
        class="bht-coach-messages"
        id="bht-coach-messages"
        role="log"
        aria-live="polite"
        aria-label="Trading coach conversation"
      ></div>

      <form class="bht-coach-compose" id="bht-coach-form">
        <textarea
          id="bht-coach-input"
          placeholder="Ask about your trades or explain what happened..."
          rows="2"
          maxlength="4000"
        ></textarea>

        <button id="bht-coach-send" type="submit">
          Send
        </button>
      </form>
    </div>

    <div id="bht-coach-error" class="bht-coach-error"></div>

    <p class="bht-coach-note">
      BHT analyzes the journal entries for your selected day.
      Your messages and trade details are sent to an AI provider
      when you use the coach. Do not enter passwords, account
      numbers, or other sensitive information. AI feedback may
      be inaccurate. BHT is not a financial adviser.
      Conversations are not permanently saved in this version.
    </p>
  `;

  review.insertBefore(container, oldPanel);

  const messagesEl = document.getElementById("bht-coach-messages");
  const input = document.getElementById("bht-coach-input");
  const dateInput = document.getElementById("bht-coach-date");
  const sendButton = document.getElementById("bht-coach-send");
  const reviewButton = document.getElementById("bht-coach-review");
  const resetButton = document.getElementById("bht-coach-reset");
  const errorEl = document.getElementById("bht-coach-error");

  const messages = [];
  let busy = false;
  let conversationDate = "";

  function localDate() {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  }

  dateInput.value = localDate();

  function addMessage(role, content) {
    const bubble = document.createElement("div");
    bubble.className = "bht-message " + role;

    const label = document.createElement("div");
    label.className = "bht-message-label";
    label.textContent = role === "assistant"
      ? "BHT COACH"
      : "YOU";

    const body = document.createElement("div");
    body.textContent = content;

    bubble.appendChild(label);
    bubble.appendChild(body);
    messagesEl.appendChild(bubble);

    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function setBusy(value) {
    busy = value;
    sendButton.disabled = value;
    reviewButton.disabled = value;
    dateInput.disabled = value;
    input.disabled = value;
    resetButton.disabled = value;
  }

  function clearChat() {
    messages.length = 0;
    messagesEl.innerHTML = "";
    errorEl.textContent = "";
    conversationDate = dateInput.value;

    addMessage(
      "assistant",
      "Welcome to BHT.\n\n" +
      "I'm here to help you understand your trading decisions, " +
      "not just your P&L.\n\n" +
      "Select a date and click Review My Day, or ask me a question. " +
      "I'll tell you what the journal supports, where your " +
      "discipline slipped, and what deserves a closer look."
    );
  }

  async function askCoach(question) {
    if (busy) return;

    if (!db || !user) {
      errorEl.textContent = "Please sign in first.";
      return;
    }

    const date = dateInput.value;

    if (!date) {
      errorEl.textContent = "Choose a trading date.";
      return;
    }

    if (conversationDate !== date) {
      clearChat();
    }

    errorEl.textContent = "";
    setBusy(true);

    const previous = messages.slice(-12);
    addMessage("user", question);

    const loading = addMessage(
      "assistant",
      "Reviewing your journal..."
    );

    try {
      const { data, error } = await db.functions.invoke(
        "bht-ai-coach",
        {
          body: {
            date,
            message: question,
            history: previous
          }
        }
      );

      if (error) {
        let detail = error.message;

        if (error.context) {
          try {
            const body = await error.context.json();
            detail = body.error || detail;
          } catch {}
        }

        throw new Error(detail);
      }

      if (!data || typeof data.reply !== "string") {
        throw new Error("The AI coach returned an invalid response.");
      }

      loading.remove();
      addMessage("assistant", data.reply);

      messages.push(
        { role: "user", content: question },
        { role: "assistant", content: data.reply }
      );

    } catch (err) {
      loading.remove();

      errorEl.textContent =
        "Coach unavailable: " +
        (err.message || "Unknown error");

      addMessage(
        "assistant",
        "I couldn't complete that review. " +
        "Please check the connection and try again."
      );

    } finally {
      setBusy(false);
      input.focus();
    }
  }

  document.getElementById("bht-coach-form")
    .addEventListener("submit", e => {
      e.preventDefault();

      const question = input.value.trim();
      if (!question || busy) return;

      input.value = "";
      askCoach(question);
    });

  reviewButton.addEventListener("click", () => {
    askCoach(
      "Review my trading day. Talk to me like a direct, " +
      "constructive trading coach. Tell me what I did right, " +
      "what I did wrong, and what I should focus on next. " +
      "Use my actual trade records and distinguish disciplined " +
      "losses from undisciplined wins. End with one question " +
      "that helps me reflect."
    );
  });

  resetButton.addEventListener("click", clearChat);

  dateInput.addEventListener("change", clearChat);

  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.getElementById("bht-coach-form")
        .requestSubmit();
    }
  });

  // Compatibility with the existing dashboard's
  // "Generate Full Review" action.
  const oldGenerate = document.getElementById("generate");

  if (oldGenerate) {
    oldGenerate.addEventListener("click", () => {
      const oldDate = document.getElementById("reviewDate");

      if (oldDate?.value) {
        dateInput.value = oldDate.value;
      }

      clearChat();

      // Run the coach review after the existing action.
      reviewButton.click();
    });
  }

  clearChat();
})();
