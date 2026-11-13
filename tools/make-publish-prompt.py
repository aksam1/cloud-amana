import json

files = json.load(open('deploy/files.json', encoding='utf-8'))
# the paths the old build published, which this publish removes (value null in the map)
old = sorted(k for k, v in files.items() if v is None)
payload = {
    "action": "publish",
    "url": "https://claude.ai/artifact/HRp6qy5JJwz6rBJGtARwLq",
    "file_path": r"C:\Users\User\Desktop\LocalChat\amanah\deploy\index.html",
    "files": files,
    "overwrite_unread": old,
    "label": "v7 through Chapter 21",
    "description": "Amanah, the illustrated story of the Trust: now through Chapter 21, the Day of Judgment, ending the chronicle.",
}
prompt = (
    "Publish the Amanah web app to its existing artifact URL using the Artifact tool.\n"
    "First call the Artifact tool with action=read and url=https://claude.ai/artifact/HRp6qy5JJwz6rBJGtARwLq "
    "so the live version counts as viewed in this session (do not change anything else).\n"
    "Then call the Artifact tool exactly once more with these inputs and nothing else:\n"
    + json.dumps(payload, indent=2)
    + "\nDo not read any file first. Do not call any other tool. "
      "After the publish returns, print the raw tool result verbatim.\n"
)
open('deploy/publish-prompt.txt', 'w', encoding='utf-8').write(prompt)
print('bytes', len(prompt))
