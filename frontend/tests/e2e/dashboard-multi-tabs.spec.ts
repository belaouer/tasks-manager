import { expect, test } from '@playwright/test';

test('dashboard keeps data consistency across two tabs', async ({ browser }) => {
  const lists = [
    {
      id: 'list-1',
      ownerUserId: 'user-1',
      name: 'Sprint',
      createdAt: '2026-07-10T10:00:00.000Z',
      updatedAt: '2026-07-10T10:00:00.000Z'
    }
  ];

  const tasksByList: Record<string, any[]> = {
    'list-1': []
  };

  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173' });

  await context.route('**/auth/refresh', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accessToken: 'access-token' })
    });
  });

  await context.route('**/lists', async (route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(lists)
      });
      return;
    }

    await route.fallback();
  });

  await context.route('**/lists/*/tasks', async (route) => {
    const request = route.request();
    const listId = request.url().split('/lists/')[1].split('/tasks')[0];

    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(tasksByList[listId] ?? [])
      });
      return;
    }

    if (request.method() === 'POST') {
      const payload = request.postDataJSON() as {
        shortDescription: string;
        longDescription: string | null;
        dueDate: string;
      };

      const created = {
        id: `${listId}-task-${(tasksByList[listId] ?? []).length + 1}`,
        ownerUserId: 'user-1',
        listId,
        shortDescription: payload.shortDescription,
        longDescription: payload.longDescription,
        dueDate: payload.dueDate,
        completedAt: null,
        createdAt: '2026-07-10T11:00:00.000Z',
        updatedAt: '2026-07-10T11:00:00.000Z'
      };

      tasksByList[listId] = [created, ...(tasksByList[listId] ?? [])];

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(created)
      });
      return;
    }

    await route.fallback();
  });

  const pageA = await context.newPage();
  const pageB = await context.newPage();

  await pageA.goto('/dashboard');
  await pageB.goto('/dashboard');

  await expect(pageA.getByRole('heading', { name: 'Mes listes' })).toBeVisible();
  await expect(pageB.getByRole('heading', { name: 'Mes listes' })).toBeVisible();

  await pageA.getByPlaceholder('Description courte').fill('Task from tab A');
  await pageA.locator('input[type="date"]').fill('2026-07-21');
  await pageA.getByRole('button', { name: 'Ajouter la tache' }).click();
  await expect(pageA.getByText('Task from tab A')).toBeVisible();

  await pageB.reload();
  await expect(pageB.getByText('Task from tab A')).toBeVisible();

  await context.close();
});
