Hi App Review Team,

Thank you for your feedback regarding **Guideline 2.5.1** (Performance — Software Requirements): clearly identifying **HealthKit** and **CareKit** use in the user interface.

**CareKit:** ThanaFit **does not** integrate or use Apple’s **CareKit** framework anywhere in the app.

**HealthKit:** ThanaFit **does** use Apple **HealthKit** on iPhone to read **step count** and **sleep (sleep analysis)** when the user chooses to sync from the Dashboard. We have added clear in-app identification of that functionality, including what is read, why it is used, and how users can manage access.

**Where to find it in the build (UI):**

1. **Dashboard (main tab):** A disclosure card titled **“Apple Health sync”** with a visible **“HealthKit”** label appears **above the row that contains the Sleep card** (the same screen section as **Steps** sync). Tapping **“Details”** in that sentence expands full copy: HealthKit reads steps and sleep for the dashboard and reminders; we do not write to Apple Health or use this data for advertising; how to change access in **Settings → Privacy & Security → Health → ThanaFit**.
2. **First sync:** The first time the user taps sync on **Sleep** or **Steps**, an **“Apple HealthKit”** alert explains the same points **before** the system Health permission dialog.
3. **Settings:** **Settings → Apple HealthKit** (iPhone): dedicated section restating HealthKit-only use (no CareKit), data types, no write-back, no advertising use, and the Settings path above.
4. **Profile (iPhone):** **Apple Health** row opens **Settings**, where the HealthKit section above is available.
5. **Notifications:** **Notifications** screen includes a short **Apple HealthKit** disclosure for consistency.
6. **In-app Privacy Policy and FAQ:** Updated text describes HealthKit data (steps, sleep), purposes, user control, and that **CareKit is not used**.

**System copy:** We also refined **Info.plist** Health usage descriptions (`NSHealthShareUsageDescription` / `NSHealthUpdateUsageDescription`) so they are specific and user-facing.

A **new build** has been uploaded and attached to this app version for re-review.

Thank you.
