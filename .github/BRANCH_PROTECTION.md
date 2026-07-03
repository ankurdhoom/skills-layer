# Branch Protection

Configure this in GitHub repository settings for `main`:

- require pull request before merging
- require the `CLI package CI / verify` check to pass
- require conversation resolution
- block force pushes
- block branch deletion
- require signed tags for release tags when available

These settings are not enforced by files alone; they must be enabled in GitHub.
