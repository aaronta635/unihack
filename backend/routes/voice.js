const express = require("express");
const router = express.Router();
const { AccessToken } = require("livekit-server-sdk");
const { requireAuth } = require("../middleware/requireAuth");

const LIVEKIT_URL = () => process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = () => process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = () => process.env.LIVEKIT_API_SECRET;

/**
 * POST /api/voice/token
 * Body: { channelId: string }
 * Requires auth (req.user set by requireAuth middleware).
 * Returns: { token: string, url: string }
 */
router.post("/token", requireAuth, async (req, res) => {
  try {
    const url = LIVEKIT_URL();
    const apiKey = LIVEKIT_API_KEY();
    const apiSecret = LIVEKIT_API_SECRET();

    if (!url || !apiKey || !apiSecret) {
      return res.status(500).json({ error: "LiveKit is not configured on the server." });
    }

    const { channelId } = req.body || {};
    const roomName = typeof channelId === "string" && channelId.trim() ? channelId.trim() : "general";

    const user = req.user;
    const identity = user.id;
    const name =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.email ||
      identity;

    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
      ttl: "6h",
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();
    res.json({ token: jwt, url });
  } catch (err) {
    console.error("Voice token error:", err);
    res.status(500).json({ error: err.message || "Failed to generate voice token" });
  }
});

/**
 * GET /api/voice/channels
 * Returns a static list of available voice channels.
 */
router.get("/channels", (_req, res) => {
  res.json({
    channels: [
      { id: "general", name: "General", description: "Hang out and chat" },
      { id: "study-room", name: "Study Room", description: "Focus and learn together" },
      { id: "quiz-help", name: "Quiz Help", description: "Get help with quizzes" },
    ],
  });
});

module.exports = router;
