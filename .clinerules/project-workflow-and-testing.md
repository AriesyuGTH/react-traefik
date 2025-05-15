## Brief overview
此檔案包含與使用者協同開發「React Traefik Dashboard v2 API Migration」專案時的特定工作流程指南、記憶庫使用規則、以及測試策略。部分規則可能也適用於其他專案。

## Memory Bank Usage
- **Mandatory Reading:** At the beginning of EVERY task, ALL core memory bank files (`projectbrief.md`, `productContext.md`, `activeContext.md`, `systemPatterns.md`, `techContext.md`, `progress.md`) MUST be read to understand the current project state. This is not optional.
- **Accurate Updates:** Memory bank files, especially `activeContext.md` and `progress.md`, must be updated accurately and promptly to reflect the latest work done, discoveries, and next steps.
- **Update Triggers:** Update memory bank files when:
    - New project patterns or insights are discovered.
    - Significant changes have been implemented.
    - The user explicitly requests an update with "update memory bank" (ALL files must be reviewed).
    - Context needs clarification.
- **Reliance:** The Memory Bank is the primary source of truth for project context between sessions.

## Project Context (React Traefik Dashboard)
- **Primary Goal:** Migrate the dashboard from Traefik v1 API to v2 API.
- **Core Technologies:** React, Redux, Node.js/Express (for backend proxy), D3.js, Docker.
- **Key Files for Status:** `activeContext.md` and `progress.md` are critical for tracking current status and immediate next steps.

## Testing Strategy
- **Visual Testing by User:** Cline is NOT required to perform visual testing of the UI.
- **Build/Packaging Test by Cline:** Testing conducted by Cline MUST ensure, at a minimum, that the project can be successfully built and packaged through its defined architecture (e.g., `npm run build-front`, `docker-compose build`).
- **User's Responsibility:** The user will take over visual testing aspekts once Cline confirms the project can be packaged.

## Context Verification and Assumptions
- **Verify Before Acting:** When memory bank information seems outdated or conflicts with new findings (e.g., from `repomix-output.xml` or direct code inspection), prioritize verifying the actual state of the codebase.
- **Do Not Assume Completion:** Do not assume a task described in the memory bank as "to-do" is still pending without first checking relevant source files if there's a possibility of prior undocumented completion. Update memory bank immediately upon such discoveries.

## Communication Style
- **Language:** Respond in繁體中文 (zh-TW).
- **Task-Driven:** Focus on executing the user's requests step-by-step.
- **Progress Updates:** Provide clear progress updates when significant milestones are reached or when prompted.
