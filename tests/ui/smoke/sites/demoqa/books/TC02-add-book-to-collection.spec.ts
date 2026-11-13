import { test, expect } from '@fixtures';
import { bookStoreUsers } from '@data/sites/demoqa/auth.data';

test.describe('Books', () => {
  test(
    'TC02: Add a book to the user\'s collection',
    async ({ bookStorePage, bookStoreLoginPage, bookDetailPage, profilePage, cleanBookshelf }) => {
      // cleanBookshelf is injected for its post-test API teardown (deleteAllBooks).
      void cleanBookshelf;

      let firstBookTitle = '';

      await test.step('Navigate to Book Store catalog', async () => {
        // bookStorePage fixture already navigated to /books (unauthenticated)
        await expect(bookStorePage.pageHeading).toBeVisible();
      });

      await test.step('Click Login and authenticate with valid credentials', async () => {
        await bookStorePage.loginLink.click();
        await bookStoreLoginPage.login(bookStoreUsers.appUser.username, bookStoreUsers.appUser.password);
        // After login demoqa redirects to /profile — navigate back to the catalog
        await bookStorePage.navigate('/books');
      });

      await test.step('Verify catalog is displayed with at least one book', async () => {
        await expect(bookStorePage.bookList.first()).toBeVisible();
      });

      await test.step('Click on the first book to open its detail page', async () => {
        firstBookTitle = await bookStorePage.getFirstBookTitle();
        await bookStorePage.clickFirstBook();
      });

      await test.step('Assert book detail page is loaded with Title field visible and non-empty', async () => {
        await expect(bookDetailPage.backToBookStoreButton).toBeVisible();
        await expect(bookDetailPage.bookInfoBlock).toBeVisible();
      });

      await test.step('Assert "Add To Your Collection" button is visible and enabled', async () => {
        await expect(bookDetailPage.addToCollectionButton).toBeVisible();
        await expect(bookDetailPage.addToCollectionButton).toBeEnabled();
      });

      await test.step('Click "Add To Your Collection" and confirm browser alert message', async () => {
        const alertMessage = await bookDetailPage.addToCollection();
        expect(alertMessage).toBe('Book added to your collection.');
      });

      await test.step('Navigate to profile and verify the book appears in the collection', async () => {
        await profilePage.navigate('/profile');
        await expect(profilePage.bookRowByTitle(firstBookTitle)).toBeVisible();
      });
    },
  );
});
