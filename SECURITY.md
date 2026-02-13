# Security Policy

## 🔒 Security Scanning with Snyk

This project uses [Snyk](https://snyk.io) for comprehensive security scanning of dependencies, containers, and infrastructure.

### 🚀 Quick Start

1. **Install Snyk CLI** (if not already installed):
   ```bash
   npm install -g snyk
   ```

2. **Authenticate with Snyk**:
   ```bash
   npm run security:auth
   # or
   snyk auth
   ```

3. **Run security tests**:
   ```bash
   npm run security:test
   ```

### 📋 Available Security Commands

| Command | Description |
|---------|-------------|
| `npm run security:test` | Test dependencies for vulnerabilities |
| `npm run security:test:docker` | Test Docker container for vulnerabilities |
| `npm run security:monitor` | Monitor project on Snyk dashboard |
| `npm run security:auth` | Authenticate with Snyk |
| `npm run security:fix` | Interactive vulnerability fix wizard |

### 🐳 Docker Security Scanning

#### Test Local Docker Image
```bash
# Build your Docker image first
docker build -t leily:latest .

# Scan the image
npm run security:test:docker
# or
snyk container test leily:latest
```

#### Test Dockerfile
```bash
snyk iac test Dockerfile
```

### 🔍 Manual Scanning Commands

#### Dependencies
```bash
# Test all projects
snyk test --all-projects

# Test with specific severity threshold
snyk test --severity-threshold=high

# Test with JSON output
snyk test --json > snyk-results.json
```

#### Container Scanning
```bash
# Test Docker image
snyk container test leily:latest

# Test with specific severity
snyk container test leily:latest --severity-threshold=high

# Test and monitor
snyk container test leily:latest --json | snyk monitor
```

#### Infrastructure as Code
```bash
# Test Dockerfile
snyk iac test Dockerfile

# Test docker-compose.yml
snyk iac test docker-compose.yml

# Test all IaC files
snyk iac test
```

### 📊 Viewing Reports

1. **Snyk Dashboard**: Visit [app.snyk.io](https://app.snyk.io) to view detailed reports
2. **GitHub Integration**: Security alerts appear in GitHub Security tab
3. **Local Reports**: Use `--json` flag to generate detailed reports

### 🛠️ CI/CD Integration

Security scanning is automatically run on:
- Every push to `main` and `stage` branches
- Every pull request to `main` and `stage` branches
- Docker image builds

### 🔧 Configuration

#### Snyk Policy File (`.snyk`)
The `.snyk` file allows you to:
- Ignore specific vulnerabilities (with justification)
- Apply patches for known issues
- Configure language-specific settings

#### Environment Variables
```bash
# Required for authentication
export SNYK_TOKEN="your-snyk-token"

# Optional: Set organization
export SNYK_ORG="your-org-id"
```

### 🚨 Security Alerts

#### High Severity Vulnerabilities
- **Build Failure**: CI/CD will fail on high-severity vulnerabilities
- **Immediate Action**: Review and fix within 24 hours
- **Documentation**: Document any exceptions in `.snyk` file

#### Medium/Low Severity
- **Monitoring**: Tracked in Snyk dashboard
- **Regular Review**: Address during regular maintenance cycles

### 🔄 Continuous Monitoring

1. **Automatic Scanning**: Every push triggers security scans
2. **Dependency Updates**: Dependabot integration for automated updates
3. **Container Scanning**: Docker images scanned on build
4. **Infrastructure**: IaC files scanned for misconfigurations

### 📈 Security Metrics

Track security improvements with:
- **Vulnerability Count**: Total vulnerabilities by severity
- **Fix Rate**: Time to fix critical issues
- **Dependency Health**: Overall project security score
- **Container Security**: Docker image security status

### 🆘 Getting Help

1. **Snyk Documentation**: [docs.snyk.io](https://docs.snyk.io)
2. **GitHub Issues**: Report security issues privately
3. **Team Chat**: Use designated security channels

### 🔐 Reporting Security Issues

For security vulnerabilities, please:
1. **DO NOT** create public GitHub issues
2. **DO** contact the security team directly
3. **DO** use encrypted communication for sensitive issues

### 📦 npm audit status (feb 2025)

Kjør `npm audit` for oppdatert status. Kjente gjenværende sårbarheter:

| Pakke | Alvorlighet | Notat |
|-------|-------------|--------|
| **jspdf** ≤4.0.0 | Critical | Oppgrader til 4.1.0 med `npm audit fix --force` (breaking change – test PDF-generering). |
| **xlsx** | High | Ingen fix tilgjengelig; vurder alternativ (f.eks. SheetJS pro eller annen bibliotek) eller begrens bruk av brukerstyrte filer. |
| **vite / esbuild** | Moderate | Gjelder dev-server, ikke production build. Fiks med vite 7+ (breaking) når klar. |
| **tar** (via @mapbox/node-pre-gyp) | High | Transitiv avhengighet fra mapbox-gl; oppdater når mapbox-gl får fix. |

Anbefaling: Kjør `npm run security:test` (Snyk) og `npm audit` regelmessig.

### 📚 Additional Resources

- [Snyk CLI Documentation](https://docs.snyk.io/snyk-cli)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
