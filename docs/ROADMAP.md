# ThanaFit Frontend Roadmap

## Current Focus
- Stabilize core tab/screen user journeys with reliable end-to-end (E2E) coverage.
- Protect recent backend-call and logging optimizations from regressions.
- Enable repeatable CI validation for release confidence.
- Add user-facing management flows for food/activity catalogs (view + edit).
- Auto-sync steps and sleep data whenever the user opens the app.
- Provide the ability to log food and exercise for previous dates.

## E2E Testing Roadmap

### Phase 0: Foundation (Week 1)
- Adopt **Maestro** as the first E2E framework for fast setup and stable mobile flow automation.
- Define test environments:
  - local dev run (developer machine),
  - CI smoke run (pull request gating),
  - pre-release regression run.
- Add a simple E2E test folder structure and naming convention.

### Phase 1: Smoke Coverage (Week 1-2)
- Implement high-value smoke tests for critical paths:
  - login/logout flow,
  - tab navigation (Dashboard, Food, Exercise, Progress/CycleSync, Profile),
  - Dashboard add water path,
  - Food add flow (search -> add -> verify),
  - Exercise quick add and delete,
  - Profile single-field update and persistence check.
- Ensure all smoke tests run in CI and fail the build on regression.

### Phase 1.5: CRUD Planning (Week 2)
- Define scope and UX for catalog management:
  - view food items list/details,
  - edit food item fields (name, nutrition, serving metadata),
  - view activity items list/details,
  - edit activity item fields (name, category, calorie profile).
- Confirm validation rules, permissions, and backend contract requirements before implementation.

### Phase 2: Regression Coverage (Week 2-3)
- Expand E2E to include medium-risk flows:
  - AddFood and AddExercise screen behaviors,
  - view + edit food item flow,
  - view + edit activity item flow,
  - date switching behavior in Dashboard/Food/Exercise,
  - app-open auto-sync for steps and sleep data,
  - core error handling states and retry actions.
- Add baseline assertions for backend-call-sensitive interactions (no duplicate visible user actions, expected refresh behavior).

### Phase 3: Reliability and Observability (Week 3-4)
- Improve test stability with deterministic waits and robust element selectors.
- Add result reporting artifacts (logs/screenshots/videos as available).
- Track run metrics:
  - pass/fail rate,
  - flaky test frequency,
  - average suite duration.

### Phase 4: Release Gate Maturity (Month 2)
- Define minimum E2E pass criteria for release branches.
- Split E2E pipeline into:
  - PR smoke subset,
  - nightly full regression suite.
- Document ownership and triage process for E2E failures.

## Stretch Goals
- Add API stubbing/mocking strategy to reduce non-deterministic failures.
- Evaluate **Detox** for deeper native-level validations once Maestro coverage is stable.
- Add performance guardrails for core flows (time-to-interact and key action latency).

## Success Criteria
- Critical user flows have automated E2E coverage and are green in CI.
- Regressions in tab navigation and key data-entry workflows are caught before release.
- E2E suite remains maintainable with low flake rate and clear failure diagnostics.
- Food item and activity item view/edit workflows are validated in automated E2E runs.
