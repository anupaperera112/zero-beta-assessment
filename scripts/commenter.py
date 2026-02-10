import json
import os
import requests
import sys

def main():
    # 1. Load Environment Variables
    token = os.getenv("GITHUB_TOKEN")
    repo = os.getenv("REPO")
    pr_number = os.getenv("PR_NUMBER")
    commit_sha = os.getenv("COMMIT_SHA")

    # 2. Read Semgrep Results
    try:
        with open("results.json", "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("No results.json found. Semgrep might have failed.")
        sys.exit(0)

    results = data.get("results", [])
    if not results:
        print("No vulnerabilities found!")
        return

    # 3. Format Comments for GitHub Review API
    # We use a Review to group all findings into one notification
    comments = []
    for issue in results:
        comments.append({
            "path": issue["path"],
            "line": issue["start"]["line"],
            "side": "RIGHT",
            "body": (
                f"### ⚠️ FYP Security Alert\n"
                f"**Rule ID:** `{issue['check_id']}`\n"
                f"**Vulnerability:** {issue['extra']['message']}\n"
                f"**Severity:** {issue['extra']['severity']}"
            )
        })

    # 4. Post to GitHub
    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/reviews"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    payload = {
        "commit_id": commit_sha,
        "event": "COMMENT",
        "body": "🤖 **FYP Semgrep Bot:** I found some potential issues in this PR.",
        "comments": comments
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 201:
        print(f"Successfully posted {len(comments)} comments.")
    else:
        print(f"Failed to post. Status: {response.status_code}, Error: {response.text}")

if __name__ == "__main__":
    main()
