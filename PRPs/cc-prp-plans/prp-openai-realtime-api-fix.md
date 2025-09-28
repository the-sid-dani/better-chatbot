# OpenAI Realtime API Implementation Fix Plan

## Executive Summary

**Current Status**: Voice chat fails with "Unknown parameter: 'session.input_audio_transcription'" error due to fundamental architectural mismatch between our implementation and OpenAI's GA (General Availability) API specification.

**Root Cause**: Implementation attempts to use beta API patterns on GA API, causing session creation failures.

**Solution**: Complete restructure of session creation flow to match GA API specification.

## Critical Issues Analysis

### 🚨 **Issue 1: Session Configuration Overload**
- **Current**: Sending complex config during initial session creation
- **GA Requirement**: Minimal session creation, then configure via events
- **Impact**: Session creation fails with parameter errors

### 🚨 **Issue 2: Transcription Architecture Confusion**
- **Current**: Mixing transcription config with realtime session
- **GA Reality**: Separate session types (`realtime` vs `transcription`)
- **Impact**: API rejects transcription parameters in realtime sessions

### 🚨 **Issue 3: Tool Registration Timing**
- **Current**: Tools sent during session creation
- **GA Pattern**: Tools configured after connection via `session.update`
- **Impact**: Complex payloads cause creation failures

## Technical Implementation Plan

### Phase 1: Session Creation Restructure

**File**: `src/app/api/chat/openai-realtime/route.ts`

**Current (Broken)**:
```typescript
body: JSON.stringify({
  session: {
    type: "realtime",
    model: "gpt-realtime",
    audio: { /* complex config */ },
    transcription: { /* not allowed */ },
    instructions: systemPrompt,
    tools: bindingTools,
  }
})
```

**Target (GA API Compliant)**:
```typescript
body: JSON.stringify({
  session: {
    type: "realtime",
    model: "gpt-realtime",
    audio: {
      output: { voice: voice || "alloy" }
    }
  }
})
```

### Phase 2: Session Update Flow Implementation

**File**: `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts`

**New Flow Required**:
1. **Create minimal session** → Get ephemeral token
2. **Establish WebRTC connection** → Connect to `/v1/realtime/calls`
3. **Send session.update event** → Configure tools, instructions, audio settings

**Implementation Points**:
```typescript
// After WebRTC connection established
const sessionUpdateEvent = {
  type: "session.update",
  session: {
    type: "realtime",
    model: "gpt-realtime",
    output_modalities: ["audio", "text"],
    audio: {
      input: {
        format: { type: "audio/pcm", rate: 24000 },
        turn_detection: { type: "semantic_vad" }
      },
      output: {
        format: { type: "audio/pcm" },
        voice: voice
      }
    },
    instructions: systemPrompt,
    tools: bindingTools
  }
};
dataChannel.send(JSON.stringify(sessionUpdateEvent));
```

### Phase 3: Remove Transcription Dependencies

**Files to Update**:
- `src/app/api/chat/openai-realtime/route.ts` - Remove transcription config
- `src/lib/ai/speech/open-ai/openai-realtime-event.ts` - Remove transcription types
- `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts` - Remove transcription event handling

**Rationale**: Speech-to-speech sessions get automatic transcription without explicit config.

### Phase 4: Event Handling Updates

**Required Event Name Updates**:
- ✅ `response.audio_transcript.delta` → `response.output_audio_transcript.delta` (DONE)
- ✅ `response.audio_transcript.done` → `response.output_audio_transcript.done` (DONE)
- ⚠️ Add missing events: `conversation.item.added`, `conversation.item.done`

## Development Tasks Breakdown

### Task 1: Fix Session Creation API
- **File**: `src/app/api/chat/openai-realtime/route.ts`
- **Action**: Simplify session config to GA API spec
- **Time**: 15 mins
- **Test**: Session creation returns 200 without parameter errors

### Task 2: Implement Session Update Flow
- **File**: `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts`
- **Action**: Add session.update event after connection
- **Time**: 30 mins
- **Test**: Tools and instructions load after connection

### Task 3: Remove Transcription Code
- **Files**: All OpenAI realtime files
- **Action**: Clean up transcription-related code
- **Time**: 15 mins
- **Test**: No transcription references remain

### Task 4: Update Event Types
- **File**: `src/lib/ai/speech/open-ai/openai-realtime-event.ts`
- **Action**: Add missing GA API events
- **Time**: 10 mins
- **Test**: Type checking passes

### Task 5: End-to-End Testing
- **Action**: Test complete voice chat flow
- **Time**: 20 mins
- **Test**: Voice chat connects, responds, creates canvas charts

## Quality Assurance Checklist

### ✅ **Technical Validation**
- [ ] Session creation returns 200 status
- [ ] WebRTC connection establishes successfully
- [ ] Audio streaming works bidirectionally
- [ ] Tool calling functions during voice chat
- [ ] Canvas integration activates for chart tools
- [ ] No console errors or API failures

### ✅ **User Experience Validation**
- [ ] Voice chat button works on first click
- [ ] Clear audio quality in both directions
- [ ] Real-time transcription displays properly
- [ ] Voice-generated charts appear in Canvas
- [ ] Conversation flow feels natural
- [ ] Error states provide clear feedback

## Implementation Priority

**HIGH PRIORITY** (Blocking Issues):
1. Task 1: Fix session creation (eliminates current error)
2. Task 2: Session update flow (enables functionality)

**MEDIUM PRIORITY** (Feature Complete):
3. Task 3: Remove transcription code (cleanup)
4. Task 4: Update event types (future-proofing)

**LOW PRIORITY** (Polish):
5. Task 5: End-to-end testing (validation)

## Handoff to Dev Team

**Context**: Current dev agent has attempted partial fixes but missed the fundamental architectural issue. The session creation pattern needs complete restructuring.

**Key Insight**: GA API requires **event-driven configuration** after connection, not **upfront configuration** during creation.

**Success Criteria**: Voice chat button connects without errors and enables real-time conversation with Canvas integration.

**Estimated Total Time**: 90 minutes development + 30 minutes testing

---

**Ready for Implementation**: This plan provides clear architectural guidance for the dev team to implement the correct GA API integration pattern.