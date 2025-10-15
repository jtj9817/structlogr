# Development Plan: Log Formatting Web Application

This document outlines the development plan for a minimal web application that uses the `Prism` package to reformat raw log text into structured JSON. The application will be built with Laravel, React, and Inertia.js. This plan is designed for a solo developer, prioritizing simplicity and rapid implementation.

## Table of Contents

1.  [Phase 1: Backend (Laravel)](#phase-1-backend-laravel)
2.  [Phase 2: Frontend (React & Inertia)](#phase-2-frontend-react--inertia)
3.  [Phase 3: Project & Database Setup](#phase-3-project--database-setup)

---

### Phase 1: Backend (Laravel)

The primary goal of this phase is to establish the server-side logic for receiving raw text, processing it with `Prism`, and storing the structured result.

#### 1. Create Database Migration and Model

A database table is required to store the raw and formatted logs.

- **Action**: Execute the Artisan command to create the model and migration file.
    ```bash
    php artisan make:model FormattedLog -m
    ```
- **Migration Schema** (`database/migrations/..._create_formatted_logs_table.php`): Define the table structure.
    ```php
    Schema::create('formatted_logs', function (Blueprint $table) {
        $table->id();
        $table->text('raw_log');
        $table->json('formatted_log');
        $table->timestamps();
    });
    ```

#### 2. Define Routes

Two routes are needed: one to render the user interface and another to handle the form submission.

- **Action**: Add the following route definitions to `routes/web.php`.

    ```php
    use App\Http\Controllers\LogFormatterController;

    Route::get('/', [LogFormatterController::class, 'show'])->name('formatter.show');
    Route::post('/format', [LogFormatterController::class, 'format'])->name('formatter.format');
    ```

#### 3. Create the `LogFormatterService`

This service will encapsulate all logic related to the `Prism` package, ensuring the controller remains lean.

- **Action**: Create a new service file at `app/Services/LogFormatterService.php`.
- **Key Logic**:
    - **System Prompt**: Define a clear system prompt for the LLM agent (e.g., _"You are an expert log analysis assistant. Your task is to reformat the given raw log text into a structured JSON object..."_).
    - **Output Schema**: Define the desired JSON output structure using `Prism\Prism\Schema` classes. The schema should include fields like `timestamp`, `level`, `message`, `source`, and a `metadata` object.
    - **Format Method**: Implement a public method `format(string $rawLog)` that uses `prism()->structured()->...` to interact with the LLM, providing the system prompt, the user's log text, and the defined schema.
    - **Response Handling**: Clean and decode the JSON response from the LLM and return it as a PHP array.

#### 4. Create the Controller

The controller will manage HTTP requests, validate input, and coordinate with the `LogFormatterService`.

- **Action**: Generate the controller using Artisan.
    ```bash
    php artisan make:controller LogFormatterController
    ```
- **Methods**:
    - `show()`: Renders the main Inertia page.
        ```php
        public function show()
        {
            return inertia('FormatterPage');
        }
        ```
    - `format()`: Validates the incoming request, calls the `LogFormatterService`, persists the result to the database, and returns the formatted log data as a prop to the frontend.

---

### Phase 2: Frontend (React & Inertia)

This phase focuses on creating a simple, functional user interface for submitting logs and displaying the formatted output.

#### 1. Create the Inertia Page

This component will serve as the single page for the application.

- **Action**: Create a new React component at `resources/js/Pages/FormatterPage.tsx`.

#### 2. Build the User Interface

- **Form**: Implement a simple form containing a `<textarea>` for the raw log input and a `<button>` for submission.
- **State Management**: Use Inertia's `useForm` hook to manage form state, handle submissions, and display validation errors.
- **API Request**: On form submission, send a `post` request to the `/format` route.
- **Output Display**: Render the formatted JSON response received from the backend. A `<pre>` tag with `JSON.stringify(response, null, 2)` is ideal for pretty-printing the JSON.
- **User Feedback**: Implement a loading indicator to provide feedback to the user while the request is in progress.

---

### Phase 3: Project & Database Setup

This final phase covers the initial project setup and database configuration.

#### 1. New Laravel Project (If Necessary)

- **Action**: Create a new Laravel project.
    ```bash
    composer create-project laravel/laravel log-formatter
    ```
- **Setup**: Install and configure Inertia.js with the React preset.
- **Dependencies**: Install the Prism package.
    ```bash
    composer require prism/prism
    ```

#### 2. Environment Configuration (`.env`)

- **Database**: Set `DB_CONNECTION=mysql` and provide the necessary credentials (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).
- **LLM API**: Add your LLM provider credentials (`LLM_API_KEY`, `LLM_BASE_URL`).

#### 3. Run Migrations

- **Action**: After configuring the database connection, create the `formatted_logs` table by running the migrations.
    ```bash
    php artisan migrate
    ```

