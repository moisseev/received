<img src="icon.svg" alt="Logo" align="right" height="48px" />

# Received

The **Received** add-on for Thunderbird displays "Received" headers parsed with a customizable regular expression, allowing for detailed analysis of email routing.

## Overview

This add-on clarifies email delivery paths, helping users understand the origins and flow of their emails.

## Features

- **Core functionality:** Displays parts of "Received" message headers that match capturing groups of a regular expression, enabling users to extract specific details.
- **Separate matches:** Returns individual matches for each "Received" header, facilitating easier analysis and clarity.

## Installation

To install the **Received** add-on, choose one of the following options:

- Download the [latest release](https://github.com/moisseev/received/releases/latest) directly from the [Releases](https://github.com/moisseev/received/releases) page.
- Access versions reviewed by `moz://a` on the [Thunderbird Add-ons page](https://addons.thunderbird.net/thunderbird/addon/received/).
- If you need to install a specific commit, download the source code from the repository and [create an XPI installer](#creating-an-xpi-installer).

## Creating an XPI installer

The `XPI` installation package is essentially a `ZIP` file with a different extension.

To create it, zip the contents of the add-on's directory (not the add-on directory itself), excluding hidden files and folders that begin with a period. Rename the ZIP file to have an `.xpi` extension (or simply drag and drop the ZIP into the `Add-ons Manager` tab).

The ZIP file should maintain the following structure:

```
received-master.zip
├── chrome/
├── defaults/
├── chrome.manifest
├── install.rdf
└── ... (other files and directories)
```

And **not** this structure:

```
received-master.zip
└── received-master/
    ├── chrome/
    ├── defaults/
    ├── chrome.manifest
    ├── install.rdf
    └── ... (other files and directories)
```

## Usage

- After installation, navigate to the add-on settings to configure the regular expression according to your needs.
- A default regular expression of `(.*)` will display all "Received" headers. Modify this to display specific parts, such as the originating host.

### Example regular expressions

This section presents several regular expressions for parsing "Received" headers in emails. These examples can be customized further based on your needs.

1. **Display all "Received" headers:**
   ```regex
   (.*)
   ```
   Captures all "Received" headers.

2. **Identify the originating host:**
   ```regex
   ^from (.+?) by mx\.example\.com
   ```
   Matches the host in the first "Received" header added by the recipient's SMTP server.

3. **Exclude TLS information:**
   ```regex
   ^from (.+?)(?: \(using .+ requested\))? by mx\.example\.com
   ```
   Similar to the previous example, but omits TLS information if present.

4. **Support for multiple mail servers:**
   ```regex
   ^from (.+?)(?: \(using .+ requested\))? by (?:mx\.example\.com|mx\.example\.org|[a-z]{3}\d-[0-9a-f]{12}\.qloud-c\.yandex\.net \(mxfront/Yandex\))
   ```
   Similar to the previous example, but accommodates accounts configured in Thunderbird on different mail servers, including `mx.example.com`, `mx.example.org`, and Yandex.Mail Service.

5. **Capture host and timestamp:**
   ```regex
   ^from (.+?) by mx\.example\.com.+for.+(; .+)$
   ```
   Uses two capturing groups to extract both the host and the timestamp.
