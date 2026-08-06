# Sample Data

`sample_workspace.json` is the reference dataset required by the Test Specification (docs 21 §2):
one configured creator, three ideas (varying status), two content records (one published), three tasks
(one in-progress, one overdue, one blocked), one overloaded week, one repurposing suggestion, and one
performance record. All values use valid enums/ranges so they pass repository validation.

**IDs shown are illustrative.** On write, `IdService` assigns the real immutable IDs; cross-references
(`Idea_ID`, `Content_ID`, `Source_Content_ID`) would be rewired by the loader.

A one-click **`loadSampleWorkspace()`** loader that writes this dataset through the real repositories
(so it doubles as an integration smoke test) is proposed as **RECOMMENDATIONS R-05** and awaits approval —
it is intentionally not implemented in Milestone 1.
