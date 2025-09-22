# Serena Usage Instructions for MelodyHub Project

`serena` is a powerful command-line tool integrated into this project to enhance development workflows, particularly for code analysis, refactoring, and understanding the project structure. It leverages Language Server Protocol (LSP) capabilities to provide deep insights into the codebase.

## How to Use Serena

`serena` commands are executed using `uvx`, which handles the tool's environment and dependencies. Always prefix your `serena` commands with `uvx --from git+https://github.com/oraios/serena serena`.

**General Syntax:**
`uvx --from git+https://github.com/oraios/serena serena <command> [subcommand] [options]`

### Useful Serena Commands

Here are some key `serena` commands and how they can assist you:

1.  **`project index`**:
    *   **Purpose:** Creates or updates the project's symbol index. This index is crucial for `serena` to understand the codebase's structure (classes, functions, variables, etc.) and enable advanced code navigation features.
    *   **When to use:** Run this command after significant code changes (e.g., adding new files, renaming symbols) to ensure `serena`'s index is up-to-date.
    *   **Example:**
        ```bash
        uvx --from git+https://github.com/oraios/serena serena project index
        ```

2.  **`project health-check`**:
    *   **Purpose:** Performs a comprehensive check of the project's tools and language server setup. While not directly analyzing your code for bugs, it ensures `serena` itself is configured correctly.
    *   **When to use:** If you encounter issues with `serena`'s functionality or suspect environmental problems.
    *   **Example:**
        ```bash
        uvx --from git+https://github.com/oraios/serena serena project health-check
        ```

3.  **`find_symbol <name_path>`**:
    *   **Purpose:** Locates specific code symbols (e.g., functions, classes, variables) within the project. You can specify a simple name or a path-like name (e.g., `MyClass/myMethod`).
    *   **When to use:** To quickly jump to the definition of a symbol, or to understand where a symbol is declared.
    *   **Example:** To find the `AudioController` class:
        ```bash
        uvx --from git+https://github.com/oraios/serena serena find_symbol AudioController
        ```
    *   **Example:** To find the `playSong` method within `AudioController`:
        ```bash
        uvx --from git+https://github.com/oraios/serena serena find_symbol AudioController/playSong
        ```

4.  **`find_referencing_symbols <name_path> --relative-path <file_path>`**:
    *   **Purpose:** Finds all occurrences where a specific symbol is referenced throughout the codebase. This is invaluable for understanding code dependencies and the impact of changes.
    *   **When to use:** Before refactoring a function or variable, to see all places that will be affected.
    *   **Example:** To find all references to the `playSong` method in `js/audio-controller.js`:
        ```bash
        uvx --from git+https://github.com/oraios/serena serena find_referencing_symbols AudioController/playSong --relative-path js/audio-controller.js
        ```

5.  **`get_symbols_overview <file_path>`**:
    *   **Purpose:** Provides a high-level overview of the top-level symbols (classes, functions, etc.) defined in a specific file.
    *   **When to use:** To quickly grasp the main components and structure of a new or unfamiliar file.
    *   **Example:**
        ```bash
        uvx --from git+https://github.com/oraios/serena serena get_symbols_overview js/ui-updater.js
        ```

### How Serena Helps in Development

*   **Code Analysis:** Use `find_symbol` and `get_symbols_overview` to quickly understand the structure and components of the codebase.
*   **Refactoring:** `find_referencing_symbols` is your best friend for safe refactoring. It helps you identify all places that need to be updated when you change a symbol's name or signature.
*   **Debugging:** By understanding the call hierarchy and symbol references, you can more effectively trace the flow of execution and pinpoint the source of bugs.
*   **Code Understanding:** `serena` provides a structured way to explore the codebase, making it easier to onboard new developers or understand complex parts of the project.

By integrating `serena` into your workflow, you can navigate, analyze, and refactor the MelodyHub project with greater efficiency and confidence.
