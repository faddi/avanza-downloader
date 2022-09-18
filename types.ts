import * as t from "https://esm.sh/io-ts@2.2.18";

const Stocks = t.type(
  {
    totalNumberOfShares: t.number,
    name: t.string,
  },
  "Stocks"
);

const AnnualMeetings = t.type(
  {
    eventDate: t.string,
    extra: t.boolean,
  },
  "AnnualMeetings"
);

const BrokerTradeSummary = t.type(
  {
    orderbookId: t.string,
    items: t.Array,
  },
  "BrokerTradeSummary"
);

const Company = t.intersection(
  [
    t.type({
      name: t.string,
      id: t.string,
      totalNumberOfShares: t.number,
    }),
    t.partial({
      sector: t.string,
      stocks: t.array(Stocks),
      chairman: t.string,
      description: t.string,
      marketCapital: t.number,
      marketCapitalCurrency: t.string,
      CEO: t.string,
    }),
  ],
  "Company"
);

const Owner = t.type(
  {
    name: t.string,
    capital: t.number,
    votes: t.number,
  },
  "Owner"
);

const CompanyOwners = t.type(
  {
    list: t.array(Owner),
    updated: t.string,
  },
  "CompanyOwners"
);

const CompanyReports = t.type(
  {
    eventDate: t.string,
    reportType: t.string,
  },
  "CompanyReports"
);

const Dividends = t.partial(
  {
    exDate: t.string,
    amountPerShare: t.number,
    paymentDate: t.string,
    currency: t.string,
  },
  "Dividends"
);

const KeyRatios = t.type(
  {
    volatility: t.number,
    priceEarningsRatio: t.number,
    directYield: t.number,
  },
  "KeyRatios"
);

const RelatedStocks = t.partial(
  {
    flagCode: t.string,
    priceOneYearAgo: t.number,
    lastPrice: t.number,
    name: t.string,
    id: t.string,
  },
  "RelatedStocks"
);

export const StockDetailsResponse = t.intersection(
  [
    t.type({
      company: Company,
      keyRatios: KeyRatios,
    }),
    t.partial({
      priceThreeMonthsAgo: t.number,
      priceOneWeekAgo: t.number,
      priceOneMonthAgo: t.number,
      priceSixMonthsAgo: t.number,
      priceAtStartOfYear: t.number,
      priceOneYearAgo: t.number,
      priceThreeYearsAgo: t.number,
      priceFiveYearsAgo: t.number,
      marketPlace: t.string,
      marketList: t.string,
      quoteUpdated: t.string,
      hasInvestmentFees: t.boolean,
      morningStarFactSheetUrl: t.string,
      currency: t.string,
      flagCode: t.string,
      shortSellable: t.boolean,
      highestPrice: t.number,
      lowestPrice: t.number,
      lastPrice: t.number,
      lastPriceUpdated: t.string,
      change: t.number,
      changePercent: t.number,
      totalVolumeTraded: t.number,
      totalValueTraded: t.number,
      isin: t.string,
      tradable: t.boolean,
      tickerSymbol: t.string,
      loanFactor: t.number,
      name: t.string,
      id: t.string,
      country: t.string,
      numberOfOwners: t.number,
      superLoan: t.boolean,
      pushPermitted: t.boolean,
      dividends: t.array(Dividends),
      relatedStocks: t.array(RelatedStocks),
      orderDepthLevels: t.Array,
      marketMakerExpected: t.boolean,
      orderDepthReceivedTime: t.string,
      latestTrades: t.Array,
      marketTrades: t.boolean,
      annualMeetings: t.array(AnnualMeetings),
      companyReports: t.array(CompanyReports),
      brokerTradeSummary: BrokerTradeSummary,
      companyOwners: CompanyOwners,
    }),
  ],
  "StockDetailsResponse"
);

// stock response
const OHLC = t.type(
  {
    timestamp: t.number,
    open: t.number,
    close: t.number,
    low: t.number,
    high: t.number,
    totalVolumeTraded: t.number,
  },
  "OHLC"
);

export const OHCLResponse = t.type(
  {
    from: t.string,
    metadata: t.type({
      resolution: t.type({
        availableResolutions: t.array(t.string),
        chartResolution: t.string,
      }),
    }),
    previousClosingPrice: t.number,
    to: t.string,
    ohlc: t.array(OHLC),
  },
  "OHCLResponse"
);
