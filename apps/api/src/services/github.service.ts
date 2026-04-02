import { createHmac } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { githubConnections, githubRepos, githubEvents } from '../db/schema/github.js'
import { tasks } from '../db/schema/tasks.js'

const TASK_ID_PATTERN = /\[SNTR-([a-f0-9-]+)\]/i

export class GitHubService {
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = process.env.GITHUB_WEBHOOK_SECRET || ''
    const expected = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex')
    return signature === expected
  }

  async handleWebhook(eventType: string, payload: Record<string, unknown>) {
    const repoFullName = (payload.repository as Record<string, unknown>)?.full_name as string
    if (!repoFullName) return

    const repo = await db.query.githubRepos.findFirst({
      where: eq(githubRepos.fullName, repoFullName),
    })
    if (!repo) return

    switch (eventType) {
      case 'push':
        await this.handlePush(repo.id, payload)
        break
      case 'pull_request':
        await this.handlePR(repo.id, payload)
        break
      case 'issues':
        await this.handleIssue(repo.id, payload)
        break
      case 'deployment_status':
        await this.handleDeployment(repo.id, payload)
        break
    }
  }

  private async handlePush(repoId: string, payload: Record<string, unknown>) {
    const commits = (payload.commits as Array<Record<string, unknown>>) || []
    for (const commit of commits) {
      const message = (commit.message as string) || ''
      const linkedTaskId = await this.extractTaskId(message)

      await db.insert(githubEvents).values({
        repoId,
        eventType: 'commit',
        githubId: commit.id as string,
        title: message.split('\n')[0] || '',
        description: message,
        author: (commit.author as Record<string, unknown>)?.name as string,
        url: commit.url as string,
        linkedTaskId,
      })
    }
  }

  private async handlePR(repoId: string, payload: Record<string, unknown>) {
    const pr = payload.pull_request as Record<string, unknown>
    const title = (pr?.title as string) || ''
    const linkedTaskId = await this.extractTaskId(title + ' ' + ((pr?.body as string) || ''))

    await db.insert(githubEvents).values({
      repoId,
      eventType: 'pr',
      githubId: String(pr?.number),
      title,
      description: (pr?.body as string) || '',
      author: ((pr?.user as Record<string, unknown>)?.login as string) || '',
      url: (pr?.html_url as string) || '',
      status: (pr?.state as string) || '',
      metadata: { action: payload.action, merged: pr?.merged },
      linkedTaskId,
    })
  }

  private async handleIssue(repoId: string, payload: Record<string, unknown>) {
    const issue = payload.issue as Record<string, unknown>
    const title = (issue?.title as string) || ''

    await db.insert(githubEvents).values({
      repoId,
      eventType: 'issue',
      githubId: String(issue?.number),
      title,
      description: (issue?.body as string) || '',
      author: ((issue?.user as Record<string, unknown>)?.login as string) || '',
      url: (issue?.html_url as string) || '',
      status: (issue?.state as string) || '',
      metadata: { action: payload.action, labels: issue?.labels },
    })
  }

  private async handleDeployment(repoId: string, payload: Record<string, unknown>) {
    const ds = payload.deployment_status as Record<string, unknown>
    const deployment = payload.deployment as Record<string, unknown>

    await db.insert(githubEvents).values({
      repoId,
      eventType: 'deployment',
      githubId: String(ds?.id),
      title: `Deployment ${(ds?.state as string) || 'unknown'}`,
      description: (ds?.description as string) || '',
      author: ((ds?.creator as Record<string, unknown>)?.login as string) || '',
      url: (ds?.target_url as string) || '',
      status: (ds?.state as string) || '',
      metadata: { environment: (deployment?.environment as string) || '' },
    })
  }

  private async extractTaskId(text: string): Promise<string | undefined> {
    const match = TASK_ID_PATTERN.exec(text)
    if (!match?.[1]) return undefined

    const task = await db.query.tasks.findFirst({ where: eq(tasks.id, match[1]) })
    return task?.id
  }

  async listRepoEvents(repoId: string) {
    return db.query.githubEvents.findMany({
      where: eq(githubEvents.repoId, repoId),
      orderBy: (e, { desc: d }) => [d(e.createdAt)],
      limit: 50,
    })
  }

  async linkRepo(projectId: string, githubRepoId: number, fullName: string) {
    const [repo] = await db
      .insert(githubRepos)
      .values({ projectId, githubRepoId, fullName })
      .returning()
    return repo!
  }

  async getRepoByProject(projectId: string) {
    return db.query.githubRepos.findFirst({ where: eq(githubRepos.projectId, projectId) })
  }

  async saveConnection(
    userId: string,
    githubUserId: number,
    githubUsername: string,
    accessToken: string,
  ) {
    const [conn] = await db
      .insert(githubConnections)
      .values({ userId, githubUserId, githubUsername, accessToken })
      .returning()
    return conn!
  }
}

export const githubService = new GitHubService()
