import { expect, test } from '@playwright/test';

test('auth + lists + tasks flow', async ({ page }) => {
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

  await page.route('**/auth/refresh', async (route) => {
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

  await page.route('**/lists', async (route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(lists)
      });
      return;
    }

    if (request.method() === 'POST') {
      const payload = request.postDataJSON() as { name: string };
      const created = {
        id: `list-${lists.length + 1}`,
        ownerUserId: 'user-1',
        name: payload.name,
        createdAt: '2026-07-10T10:00:00.000Z',
        updatedAt: '2026-07-10T10:00:00.000Z'
      };
      lists.unshift(created);
      tasksByList[created.id] = [];
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(created)
      });
      return;
    }

    await route.fallback();
  });

  await page.route('**/lists/*', async (route) => {
    const request = route.request();

    if (request.method() === 'DELETE') {
      const listId = request.url().split('/lists/')[1];
      const index = lists.findIndex((item) => item.id === listId);
      if (index >= 0) {
        lists.splice(index, 1);
      }
      delete tasksByList[listId];
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    await route.fallback();
  });

  await page.route('**/lists/*/tasks', async (route) => {
    const request = route.request();
    const effectiveListId = request.url().split('/lists/')[1].split('/tasks')[0];

    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(tasksByList[effectiveListId] ?? [])
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
        id: `${effectiveListId}-task-${(tasksByList[effectiveListId] ?? []).length + 1}`,
        ownerUserId: 'user-1',
        listId: effectiveListId,
        shortDescription: payload.shortDescription,
        longDescription: payload.longDescription,
        dueDate: payload.dueDate,
        completedAt: null,
        createdAt: '2026-07-10T11:00:00.000Z',
        updatedAt: '2026-07-10T11:00:00.000Z'
      };
      tasksByList[effectiveListId] = [created, ...(tasksByList[effectiveListId] ?? [])];
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(created)
      });
      return;
    }

    await route.fallback();
  });

  await page.route('**/lists/*/tasks/*/complete', async (route) => {
    const url = route.request().url();
    const [listId, taskId] = url.split('/lists/')[1].split('/tasks/');
    const cleanTaskId = taskId.replace('/complete', '');
    const task = tasksByList[listId]?.find((item) => item.id === cleanTaskId);
    if (task) {
      task.completedAt = '2026-07-11T11:00:00.000Z';
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(task)
    });
  });

  await page.route('**/lists/*/tasks/*/reopen', async (route) => {
    const url = route.request().url();
    const [listId, taskId] = url.split('/lists/')[1].split('/tasks/');
    const cleanTaskId = taskId.replace('/reopen', '');
    const task = tasksByList[listId]?.find((item) => item.id === cleanTaskId);
    if (task) {
      task.completedAt = null;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(task)
    });
  });

  await page.route('**/lists/*/tasks/*', async (route) => {
    const request = route.request();
    if (request.method() !== 'DELETE') {
      await route.fallback();
      return;
    }

    const url = request.url();
    const [listId, taskId] = url.split('/lists/')[1].split('/tasks/');
    tasksByList[listId] = (tasksByList[listId] ?? []).filter((item) => item.id !== taskId);
    await route.fulfill({ status: 204, body: '' });
  });

  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { name: 'Mes listes' })).toBeVisible();
  await page.getByPlaceholder('Description courte').fill('Tester le flow e2e');
  await page.locator('input[type="date"]').fill('2026-07-20');
  await page.getByRole('button', { name: 'Ajouter la tache' }).click();

  await expect(page.getByText('Tester le flow e2e')).toBeVisible();
  await page.getByRole('button', { name: 'Details' }).first().click();
  await expect(page.getByRole('heading', { name: 'Detail de la tache' })).toBeVisible();
  await expect(page.getByText('Informations completes de la tache selectionnee.')).toBeVisible();

  await page.getByRole('button', { name: 'Completer' }).first().click();
  await expect(page.getByText('Terminee').first()).toBeVisible();
});
