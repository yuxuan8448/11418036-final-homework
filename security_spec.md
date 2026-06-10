# Security Specification - Personal Task Planning & Schedule System

This document specifies the Attribute-Based Access Control (ABAC) and state integrity constraints for the Japanese Minimalist Personal Schedule & Task Planning Platform.

## 1. Data Invariants

- **User Profiles (`/users/{userId}`)**:
  - Direct read and write are restricted strictly to the owner (`request.auth.uid == userId`).
  - No anonymous access or unauthorized query lists. Users cannot list other users' accounts.
  - Creation requires verified authentication (`request.auth.uid != null`).

- **Project Categories (`/projects/{projectId}`)**:
  - Restructured to be user-specific. No user can see, read, update, or delete lists of categories belonging to other users.
  - On create, `userId` must match `request.auth.uid`.
  - On update, `userId` is immutable.

- **Tasks (`/tasks/{taskId}`)**:
  - Access (read, write) is restricted strictly to the task owner (`resource.data.userId == request.auth.uid`).
  - Upon creation, `userId` must strictly match `request.auth.uid`.
  - Upon updates, the `userId` field is completely immutable to prevent identity spoofing or state injection.
  - Timestamps (`createdAt`, `updatedAt`) must conform to server verification (`request.time`).

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent attacker attempts to breach identity, integrity, or scope:

1. **User Identity Hijack (Create Profile on Other user ID)**:
   - Path: `/users/victim_123`
   - Payload: `{"uid": "victim_123", "email": "victim@gmail.com", "displayName": "Attacker"}`
   - *Should fail because:* `request.auth.uid` is `attacker_456`, matching fails.

2. **Project Spoofing (Create Project for other User)**:
   - Path: `/projects/proj_abc`
   - Payload: `{"id": "proj_abc", "name": "Work", "color": "#000", "userId": "victim_uid"}`
   - *Should fail because:* Creator payload `userId` does not match auth UID `attacker_uid`.

3. **Immutable Field Poisoning (Change User of existing Project)**:
   - Path: `/projects/proj_abc`
   - Payload (Update): `{"id": "proj_abc", "name": "Hack", "color": "#111", "userId": "attacker_uid"}` (with original user being `victim_uid`)
   - *Should fail because:* `userId` is immutable.

4. **Task Injection (Create Task for other User)**:
   - Path: `/tasks/task_evil`
   - Payload: `{"id": "task_evil", "title": "Phishing", "completed": false, "userId": "victim_uid", "dueDate": "2026-06-15", "priority": "high"}`
   - *Should fail because:* `userId` must match `request.auth.uid`.

5. **Task Owner Hijack (Update user ID of existing Task)**:
   - Path: `/tasks/task_123`
   - Payload (Update): `{"id": "task_123", "title": "Change Owner", "completed": false, "userId": "attacker_uid", "dueDate": "2026-06-15", "priority": "high"}`
   - *Should fail because:* Auth UID is victim, attacker is hijacking it or vice versa.

6. **Timestamp Spoofing (Pre-dating task creation)**:
   - Path: `/tasks/task_123`
   - Payload (Create): `{"id": "task_123", "title": "Old Task", "completed": false, "userId": "attacker_uid", "dueDate": "2026-06-15", "priority": "high", "createdAt": "2020-01-01T00:00:00Z"}`
   - *Should fail because:* `createdAt` must match `request.time`.

7. **Priority Enumeration Poisoning (Invalid Priority Value)**:
   - Path: `/tasks/task_123`
   - Payload: `{"id": "task_123", "title": "Bad Pri", "completed": false, "userId": "attacker_uid", "dueDate": "2026-06-15", "priority": "EXTREME"}`
   - *Should fail because:* `priority` must match enum `['low', 'medium', 'high']`.

8. **Giant String Ingress (Denial of Wallet payload sizing)**:
   - Path: `/tasks/task_123`
   - Payload: `{"id": "task_123", "title": "[1MB STRING...]", "completed": false, "userId": "attacker_uid", "dueDate": "2026-06-15", "priority": "high"}`
   - *Should fail because:* `title.size() <= 100` restriction in rule validation helper.

9. **Ghost Field Injection (Undocumented fields escaping schema)**:
   - Path: `/tasks/task_123`
   - Payload: `{"id": "task_123", "title": "Clean room", "completed": false, "userId": "attacker_uid", "dueDate": "2026-06-15", "priority": "high", "isAdminOverride": true}`
   - *Should fail because:* Strict schema validation checks precise fields size using `data.keys().hasAll()` and keys size check in creation rules.

10. **Query Scraper Check (Blanket read list of tasks with no filter)**:
    - Operation: `list` of `/tasks`
    - Request: `getDocs(collection("tasks"))`
    - *Should fail because:* Security rules reject requests without query checks matching owner ID.

11. **Project Category Foreign Deletion**:
    - Path: `/projects/victim_project`
    - Auth: `attacker_uid`
    - *Should fail because:* Only project owner can edit or delete their own project.

12. **Task Deletion on Behalf of Others**:
    - Path: `/tasks/victim_task`
    - Auth: `attacker_uid`
    - *Should fail because:* Only task owner can delete tasks.

---

## 3. Test Runner Blueprint (`firestore.rules.test.ts`)

In an automated environment, tests are run through Jest or Firebase Local Emulator Suite. Below is the behavioral model:

```ts
import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";

// Standard Firestore Rules Security Integration Tests
describe("Firestore Rules security validation", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "final-036-2933d",
      firestore: {
        rules: require("fs").readFileSync("firestore.rules", "utf8"),
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("should block non-owners from creating user profiles", async () => {
    const attackerDb = testEnv.authenticatedContext("attacker_uid").firestore();
    const badRef = attackerDb.collection("users").doc("victim_uid");
    await expect(badRef.set({ uid: "victim_uid", email: "victim@gmail.com" })).rejects.toThrow();
  });

  it("should block tasks without proper server timestamps", async () => {
    const userDb = testEnv.authenticatedContext("user_abc").firestore();
    const badTask = userDb.collection("tasks").doc("task_1");
    await expect(badTask.set({
      id: "task_1",
      title: "Cheated Time",
      completed: false,
      userId: "user_abc",
      dueDate: "2026-06-15",
      priority: "high",
      createdAt: "2020-01-01T00:00:00Z"
    })).rejects.toThrow();
  });
});
```
