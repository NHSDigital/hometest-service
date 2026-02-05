# Contributing to HomeTest Service

Thank you for your interest in contributing. We welcome contributions that help improve the service
for NHS patients and staff.

## Branching Strategy (Gitflow)

We follow the **Gitflow** workflow. Please ensure your work is branched correctly:

- **`main`**: Contains production-ready code. No direct commits.
- **`develop`**: The main integration branch for features. All PRs for new features should target
  this branch.
- **`feature/`**: Used for new features. Branch off from `develop` and merge back into `develop`.
- **`release/`**: Used for preparing a new production release. Branch off from `develop` and merge
  into both `main` and `develop`.
- **`hotfix/`**: Used for urgent production fixes. Branch off from `main` and merge into both `main`
  and `develop`.

### Branch Naming Convention

- `feature/HOTE-[JIRA-ID]-short-description`
- `hotfix/HOTE-[JIRA-ID]-short-description`

## Development Standards

Most of the checks are run using pre-commit check `../.pre-commit-config.yaml` for more details.

You can enable automatic pre-commit run as pre-commit hook, just execute `pre-commit install`, if you want to trigger that manually just run `pre-commit run --all-files --show-diff-on-failure` or `mise run pre-commit`.

### Local Quality Checks

We use several scripts to maintain code quality, which are also run in our CI pipeline. You can run
these locally before pushing:

- **File Formatting**: `./scripts/githooks/check-file-format.sh`
- **Markdown Linting**: `./scripts/githooks/check-markdown-format.sh`
- **Secret Scanning**: `./scripts/githooks/scan-secrets.sh` (Requires `gitleaks`)
- **Inclusive Language**: `./scripts/githooks/check-english-usage.sh`

### Component Guidelines

- **Frontend**: Follow Next.js best practices in `/frontend`.
- **Lambdas**: Use strict TypeScript typing in `/lambdas`.
- **Infrastructure**: All AWS changes must be defined in `infra/` using CDK.
- **API Specs**: Updates to `architecture/api_spec.yaml` must maintain FHIR compliance.

## Pull Request Process

1. **Target Branch**: Ensure your PR targets `develop` (unless it is a production `hotfix`).
2. **Update Documentation**: Update `/docs` or `/architecture` if system behavior changes.
3. **Tests**: Include tests in `/tests` for all new logic.
4. **CI Status**: Your PR must pass all checks before it can be merged.

## NHS Standards

All contributions must adhere to the [NHS Service Manual](https://service-manual.nhs.uk/)
and [Accessibility Standards](https://service-manual.nhs.uk/accessibility).
