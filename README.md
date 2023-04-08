# J. Safra Sarasin: Download as CSV

Chrome extension that adds Download buttons to the Transactions and Payments pages in the [J. Safra Sarasin](https://www.jsafrasarasin.com/) eBanking interface.
This is confirmed to work for the [Luxembourg bank](https://ebanking-lu.jsafrasarasin.com/ebanking/), support for other location is unknown.

## Usage

1. Navigate to the `Portfolios > Transactions` or `Payments > Overview` page.
2. Adjust the filters to select the desired transactions, e.g. "This year".
3. Click the 💾 Download button in the toolbar.

A separate CSV file will be downloaded for each account, with Account, Date, Payee, Amount, Currency, and Notes columns.

## Installation

1. Clone this repository.
2. Follow the ["Loading an unpackaged extension" guide](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
