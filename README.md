# xbar-clockify

Xbar wrapper for Clockify - A menubar app to track your time using Clockify.

## Description

xbar-clockify is a menubar application that integrates with Clockify, allowing you to easily track your work hours directly from your Mac's menubar. It provides quick access to clock in, clock out, and view your current work status.

## Features

- Display current work status in the menubar
- Clock in and clock out with a single click
- Automatic notifications when connected to your company network
- View total time worked for the day
- Quick link to Clockify web tracker

## Prerequisites

- Node.js (v14 or later recommended)
- npm (comes with Node.js)
- Xbar installed on your Mac

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/your-username/xbar-clockify.git
   cd xbar-clockify
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the project root and add your Clockify API credentials:
   ```
   API_TOKEN=your_clockify_api_token
   WORKSPACE_ID=your_workspace_id
   PROJECT_ID=your_project_id
   MY_USER_ID=your_user_id
   BASE_URL=https://api.clockify.me
   COMPANY_NETWORK=YourCompanyWiFiName
   ```

## Building the Project

To build the project, run the following command:

```
npm run build
```

This command will:

1. Compile TypeScript files to JavaScript
2. Copy shell scripts to the dist folder

## Running the Application

After building the project:

1. Copy or symlink the `dist/index.js` file to your Xbar plugins folder (usually `~/.xbar/plugins/`).
2. Make sure the file is executable:
   ```
   chmod +x ~/.xbar/plugins/index.js
   ```
3. Refresh Xbar or restart it to see the plugin in your menubar.

## Development

For development, you can use the following command to run the TypeScript files directly:

```
npm run dev
```

## Scripts

- `npm run build`: Builds the project
- `npm run start`: Runs the compiled JavaScript
- `npm run dev`: Runs the TypeScript files directly using ts-node

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any problems or have any questions, please open an issue in the GitHub repository.
