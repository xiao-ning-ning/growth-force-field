# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.3.x  | :white_check_mark: |
| < 1.3  | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please do **not** open a public GitHub issue.

Instead, please report it by:

1. **Email**: Contact the repository owner directly via GitHub's security advisor form
2. **GitHub Security Advisories**: Go to the repository's "Security" tab and click "Report a vulnerability"

Please include as much detail as possible:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

## Security Best Practices for Deployment

- **API Key Security**: Do not commit `.env` files. The default `OPENAI_API_KEY` should be replaced with a valid key before deployment.
- **Network Access**: When deploying on a shared network, consider binding the server to `127.0.0.1` instead of `0.0.0.0` to restrict access.
- **Session Secrets**: `SESSION_SECRET` is auto-generated on first launch. For production environments, set a strong custom secret in `.env`.
- **Data Privacy**: All data is stored locally on the machine running the server. Ensure the server machine is properly secured and backed up.

We aim to respond to security reports within 48 hours and will keep you updated on the progress.
