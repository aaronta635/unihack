"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  Track,
  RemoteTrackPublication,
  type Participant,
} from "livekit-client";
import { api, type VoiceChannel } from "@/lib/api/client";
import { ArrowLeft, Mic, MicOff, PhoneOff, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimeBackground from "@/components/game/Background";

type ParticipantInfo = {
  identity: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isLocal: boolean;
};

function extractParticipantInfo(p: Participant, isLocal: boolean): ParticipantInfo {
  const audioTrack = Array.from(p.audioTrackPublications.values()).find(
    (pub) => pub.source === Track.Source.Microphone
  );
  return {
    identity: p.identity,
    name: p.name || p.identity,
    isSpeaking: p.isSpeaking,
    isMuted: audioTrack ? audioTrack.isMuted : true,
    isLocal,
  };
}

export default function VoicePage() {
  const router = useRouter();
  const [channels, setChannels] = useState<VoiceChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.voice.getChannels().then(setChannels).catch(() => {});
  }, []);

  const updateParticipants = useCallback((r: Room) => {
    const local = extractParticipantInfo(r.localParticipant, true);
    const remotes = Array.from(r.remoteParticipants.values()).map((p) =>
      extractParticipantInfo(p, false)
    );
    setParticipants([local, ...remotes]);
  }, []);

  const joinChannel = useCallback(
    async (channelId: string) => {
      setError(null);
      setIsConnecting(true);
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error(
            "Microphone access is not available. Please use HTTPS or open via localhost."
          );
        }
        const { token, url } = await api.voice.getToken(channelId);
        const newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        newRoom
          .on(RoomEvent.ParticipantConnected, () => updateParticipants(newRoom))
          .on(RoomEvent.ParticipantDisconnected, () => updateParticipants(newRoom))
          .on(RoomEvent.ActiveSpeakersChanged, () => updateParticipants(newRoom))
          .on(RoomEvent.TrackMuted, () => updateParticipants(newRoom))
          .on(RoomEvent.TrackUnmuted, () => updateParticipants(newRoom))
          .on(
            RoomEvent.TrackSubscribed,
            (track, _pub, _participant) => {
              if (track.kind === Track.Kind.Audio) {
                const el = track.attach();
                el.id = `audio-${track.sid}`;
                document.body.appendChild(el);
              }
              updateParticipants(newRoom);
            }
          )
          .on(
            RoomEvent.TrackUnsubscribed,
            (track) => {
              track.detach().forEach((el) => el.remove());
              updateParticipants(newRoom);
            }
          )
          .on(RoomEvent.Disconnected, () => {
            setIsConnected(false);
            setRoom(null);
            setParticipants([]);
          });

        await newRoom.connect(url, token);
        await newRoom.localParticipant.setMicrophoneEnabled(true);

        setRoom(newRoom);
        setSelectedChannel(channelId);
        setIsConnected(true);
        setIsMuted(false);
        updateParticipants(newRoom);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to join voice channel";
        setError(message);
      } finally {
        setIsConnecting(false);
      }
    },
    [updateParticipants]
  );

  const leaveChannel = useCallback(() => {
    if (room) {
      room.remoteParticipants.forEach((p) => {
        p.audioTrackPublications.forEach((pub) => {
          if (pub.track) pub.track.detach().forEach((el) => el.remove());
        });
      });
      room.disconnect();
      setRoom(null);
    }
    document.querySelectorAll("audio[id^='audio-']").forEach((el) => el.remove());
    setIsConnected(false);
    setSelectedChannel(null);
    setParticipants([]);
    setIsMuted(false);
  }, [room]);

  const toggleMute = useCallback(async () => {
    if (!room) return;
    const next = !isMuted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setIsMuted(next);
    updateParticipants(room);
  }, [room, isMuted, updateParticipants]);

  useEffect(() => {
    return () => {
      room?.disconnect();
    };
  }, [room]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimeBackground />
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                leaveChannel();
                router.push("/Dashboard");
              }}
              className="text-[#4a2b3e] hover:bg-[#ffe6f0]/60 font-semibold border-2 border-[#ffb3c6] bg-white/60 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-lg font-black text-[#4a2b3e]">Voice Channels</h1>
          </div>
        </div>

        <div className="p-4 md:px-8 max-w-2xl mx-auto space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border-2 border-red-300 bg-red-50/90 backdrop-blur-sm p-4 text-red-700 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          {!isConnected ? (
            /* Channel selection */
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <p className="text-sm text-[#8b5a7a] font-semibold">
                Choose a voice channel to join:
              </p>
              {channels.length === 0 && (
                <p className="text-xs text-[#8b5a7a]">Loading channels...</p>
              )}
              {channels.map((ch) => (
                <motion.button
                  key={ch.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isConnecting}
                  onClick={() => joinChannel(ch.id)}
                  className="w-full rounded-2xl border-2 border-[#ffd6e8] bg-gradient-to-r from-[#ffe6f0]/90 via-[#fff7fb]/90 to-[#ffe6de]/90 backdrop-blur-xl p-5 shadow-lg shadow-pink-200/40 text-left transition-all hover:border-[#ffb3c6] hover:shadow-pink-300/50 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#4a2b3e]">{ch.name}</h3>
                      <p className="text-xs text-[#8b5a7a] mt-0.5">{ch.description}</p>
                    </div>
                    {isConnecting ? (
                      <Loader2 className="w-5 h-5 text-[#ff8a8a] animate-spin" />
                    ) : (
                      <Mic className="w-5 h-5 text-[#ff8a8a]" />
                    )}
                  </div>
                </motion.button>
              ))}
            </motion.section>
          ) : (
            /* In-channel view */
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Channel header */}
              <div className="rounded-2xl border-2 border-[#ffd6e8] bg-gradient-to-r from-[#ffe6f0]/90 via-[#fff7fb]/90 to-[#ffe6de]/90 backdrop-blur-xl p-5 shadow-lg shadow-pink-200/40">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#4a2b3e]">
                      {channels.find((c) => c.id === selectedChannel)?.name ?? selectedChannel}
                    </h2>
                    <p className="text-xs text-[#8b5a7a] flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5" /> {participants.length} connected
                    </p>
                  </div>
                </div>

                {/* Participants */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {participants.map((p) => (
                    <div
                      key={p.identity}
                      className={`flex items-center gap-2.5 rounded-xl p-3 transition-all ${
                        p.isSpeaking
                          ? "bg-green-100/80 border-2 border-green-300 shadow-md shadow-green-200/40"
                          : "bg-white/60 border-2 border-[#ffd6e8]"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                          p.isSpeaking
                            ? "bg-gradient-to-br from-green-400 to-green-600 ring-2 ring-green-300 ring-offset-1"
                            : "bg-gradient-to-br from-[#ffc5d0] to-[#ff8a8a]"
                        }`}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#4a2b3e] truncate">
                          {p.name} {p.isLocal && "(You)"}
                        </p>
                        <p className="text-[10px] text-[#8b5a7a]">
                          {p.isMuted ? "Muted" : p.isSpeaking ? "Speaking" : "Listening"}
                        </p>
                      </div>
                      {p.isMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={toggleMute}
                  className={`rounded-full w-14 h-14 shadow-lg transition-all ${
                    isMuted
                      ? "bg-red-100 hover:bg-red-200 border-2 border-red-300 text-red-600"
                      : "bg-green-100 hover:bg-green-200 border-2 border-green-300 text-green-600"
                  }`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>

                <Button
                  onClick={leaveChannel}
                  className="rounded-full w-14 h-14 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-300/40"
                  title="Leave channel"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </div>
  );
}
