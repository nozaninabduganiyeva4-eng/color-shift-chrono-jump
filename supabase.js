/**
 * Supabase Global Leaderboard Integration
 * Handles fetching top scores and submitting player records via Supabase REST API.
 */

const SUPABASE_URL = "https://txvwfrlfmeeyzvkxgmnj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4dndmcmxmbWVleXp2a3hnbW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2OTYxMzgsImV4cCI6MjEwNjI3MjEzOH0.OfykMjR5OMCWSs7S8ydu3hk8yuhaZgEuXhoVMqaGdfY";

class LeaderboardClient {
  constructor() {
    this.tableUrl = `${SUPABASE_URL}/rest/v1/chrono_jump_scores`;
  }

  getHeaders() {
    return {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };
  }

  async getTopScores(limit = 10) {
    try {
      const res = await fetch(`${this.tableUrl}?select=player_name,score,level,created_at&order=score.desc&limit=${limit}`, {
        method: "GET",
        headers: this.getHeaders()
      });

      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`);
      }

      const data = await res.json();
      return data;
    } catch (err) {
      console.warn("Supabase fetch fallback to local:", err);
      return this.getLocalScores();
    }
  }

  async submitScore(playerName, score, level) {
    const cleanName = (playerName || "CyberRunner").trim().substring(0, 15);
    const payload = {
      player_name: cleanName,
      score: Math.floor(score),
      level: level || 1
    };

    // Save to local storage as well
    this.saveLocalScore(payload);

    try {
      const res = await fetch(this.tableUrl, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Supabase insert failed: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.warn("Failed to push score to Supabase, stored locally:", err);
      return null;
    }
  }

  getLocalScores() {
    try {
      const raw = localStorage.getItem("chrono_jump_leaderboard");
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    return [
      { player_name: "ChronoMaster", score: 8450, level: 7 },
      { player_name: "NeonViper", score: 5620, level: 5 },
      { player_name: "QuantumGhost", score: 3890, level: 3 },
      { player_name: "GlitchRunner", score: 2150, level: 2 },
      { player_name: "SynthPilot", score: 1200, level: 1 }
    ];
  }

  saveLocalScore(entry) {
    const list = this.getLocalScores();
    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    const top = list.slice(0, 20);
    try {
      localStorage.setItem("chrono_jump_leaderboard", JSON.stringify(top));
    } catch (e) {}
  }
}

window.leaderboardClient = new LeaderboardClient();
