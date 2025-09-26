# GitHub Secrets Setup

Go to your GitHub repository: https://github.com/tomasmb/arborschool-preu

Then navigate to: **Settings** > **Secrets and variables** > **Actions** > **New repository secret**

Add these two secrets:

## 1. GCP_WORKLOAD_IDENTITY_PROVIDER

```
projects/406789736365/locations/global/workloadIdentityPools/github-actions/providers/github-provider
```

## 2. GCP_SERVICE_ACCOUNT

```
github-actions@arbor-school-473319.iam.gserviceaccount.com
```

After adding both secrets, the GitHub Actions workflow will automatically deploy on the next push to main!

---

## DNS Setup for preu.arbor.school

You also need to add a CNAME record in your domain registrar:

**Name:** `preu`
**Type:** `CNAME`
**Value:** `ghs.googlehosted.com`

This will allow preu.arbor.school to point to your Cloud Run service.