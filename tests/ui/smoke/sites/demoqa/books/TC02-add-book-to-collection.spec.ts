import { test, expect } from '@fixtures/sites/demoqa/demoqa.fixtures';

// Spec: docs/test-cases/demoqa/book-store-crud-test-cases.md — TC02 (automation handoff M4)
test.describe('Books', () => {
  test(
    'TC02: Add a book to the user\'s collection',
    { tag: ['@smoke', '@mutates-data'] },
    async ({
      workerUser,
      bookController,
      cleanBookshelf,
      bookStorePage,
      bookStoreLoginPage,
      bookDetailPage,
      profilePage,
    }) => {
      // cleanBookshelf empties workerUser's collection before and after the test.
      void cleanBookshelf;

      // Reference data discovered via API — the expected values of this TC.
      const [book] = await bookController.getAll();
      expect(book, 'catalog API returned at least one book').toBeDefined();
      const { title, author } = book!;

      await test.step('Open /books — heading and first row title match the catalog', async () => {
        await expect(bookStorePage.pageHeading).toBeVisible();
        await expect(bookStorePage.firstBookTitleLink).toHaveText(title);
      });

      await test.step('Click Login — login form is visible', async () => {
        await bookStorePage.loginLink.click();
        await expect(bookStoreLoginPage.loginButton).toBeVisible();
      });

      await test.step('Log in as the worker user — profile shows that username', async () => {
        await bookStoreLoginPage.login(workerUser.username, workerUser.password);
        await expect(profilePage.currentPage).toHaveURL(/\/profile$/);
        await expect(profilePage.usernameValue).toHaveText(workerUser.username);
      });

      await test.step('Open /books — first row title matches the catalog', async () => {
        await bookStorePage.navigate('/books');
        await expect(bookStorePage.firstBookTitleLink).toHaveText(title);
      });

      await test.step('Open the book — detail title matches and Add is enabled', async () => {
        await bookStorePage.clickFirstBook();
        await expect(bookDetailPage.titleValue).toHaveText(title);
        await expect(bookDetailPage.addToCollectionButton).toBeEnabled();
      });

      await test.step('Add To Your Collection — alert confirms the addition', async () => {
        const alertMessage = await bookDetailPage.addToCollection();
        expect(alertMessage).toBe('Book added to your collection.');
      });

      await test.step('Open /profile — exactly one row with the book title and author', async () => {
        await profilePage.navigate('/profile');
        await expect(profilePage.bookRowByTitle(title)).toHaveCount(1);
        await expect(profilePage.bookRowByTitle(title)).toContainText(author);
      });
    },
  );
});
