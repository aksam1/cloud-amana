import json, os

files = json.load(open('deploy/files.json', encoding='utf-8'))
# The bundles the live artifact still holds, so the publish can name the ones it removes.
# deploy/live-files.txt is written from the Artifact tool's own listing of the live version;
# without it we fall back to the nulls in the map (what the last local build knew was gone).
live_path = 'deploy/live-files.txt'
if os.path.exists(live_path):
    live = [l.strip() for l in open(live_path, encoding='utf-8') if l.strip()]
    old = sorted(p for p in live if p.startswith('assets/') and p not in files)
else:
    old = sorted(k for k, v in files.items() if v is None)
# every removed bundle is also given a null, so the publish call can delete it
for p in old:
    files[p] = None
payload = {
    "action": "publish",
    "url": "https://claude.ai/artifact/HRp6qy5JJwz6rBJGtARwLq",
    "file_path": r"C:\Users\User\Desktop\LocalChat\amanah\deploy\index.html",
    # the files map is relative to the repository's parent (the artifact tool's own cwd)
    "root": "amanah",
    "files": files,
    "overwrite_unread": old,
    "label": "v8 through Chapter 21",
    "description": "Amanah, the illustrated story of the Trust: through Chapter 21, the Day of Judgment, ending the chronicle. This build gives every town the architecture of its own century and redraws the map as a map of time.",
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
