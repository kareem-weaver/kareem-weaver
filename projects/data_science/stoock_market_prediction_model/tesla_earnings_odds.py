# Same as "odds_of_movement" except only analyzing movement one week after earnings for Tesla. 
# Hard coded to only work with Tesla's earnings.

import yfinance as yf
import numpy as np
import pandas as pd
from datetime import datetime

class StockAnalysis:
    def __init__(self, ticker, n=1, EarningsDates=[]):
        self.ticker = ticker
        self.n = n
        self.EarningsDates = EarningsDates

    def getPricesAroundEarnings(self):
        earningsStartList = []
        earningsEndList = []
        for date_str in self.EarningsDates:
            # Convert the date string to a datetime object
            date_num = datetime.strptime(date_str, '%Y-%m-%d')

            # Calculate start and end dates. The interval around earnings can be changed. In this case, I am interested in Tesla price action one week after earnings (0,7).
            startDate = date_num - pd.Timedelta(days=0)
            endDate = date_num + pd.Timedelta(days=7)

            # Append dates to lists
            earningsStartList.append(startDate)
            earningsEndList.append(endDate)

        # Format the dates as strings
        earningsStartList = [date.strftime('%Y-%m-%d') for date in earningsStartList]
        earningsEndList = [date.strftime('%Y-%m-%d') for date in earningsEndList]

        # Combine start and end dates into tuples
        start_endTupleList = list(zip(earningsStartList, earningsEndList))

        return start_endTupleList

    def findProb(self):
        stock = yf.Ticker(self.ticker)

        # Query all historical prices
        stock = stock.history(period="max")

        # Keep only necessary columns
        stock = stock[["Open", "Close", "Low", "High", "Volume"]]

        # Calculate the target column
        stock["Tomorrow"] = stock["Close"].shift(-1)
        stock["Target"] = (stock["Tomorrow"] > stock["Close"]).astype(int)

        # Get the date ranges around earnings dates
        date_ranges = self.getPricesAroundEarnings()

        all_vectors = []
        for start_date, end_date in date_ranges:
            stock_trun = stock.loc[start_date:end_date]
            if stock_trun.empty:
                print(f"No data available for the period {start_date} to {end_date}")
                continue
            all_vectors.extend(stock_trun['Target'].dropna().values)

        if not all_vectors:
            print("No valid data found for any earnings periods.")
            return None

        vect = np.array(all_vectors)

        # Count up and down days
        numOfUps = np.sum(vect)
        numOfDowns = len(vect) - numOfUps
        print("Total number of up days:", numOfUps)
        print("Total number of down days:", numOfDowns)
        print("\nPercent of up days:", numOfUps / len(vect) * 100)
        print("Percent of down days:", numOfDowns / len(vect) * 100)

        # Checking cases for transitions [[UU, DU], [UD, DD]]
        down = 0
        up = 0
        downDown = 0
        upUp = 0
        downUp = 0
        upDown = 0
        for i in range(len(vect) - 1):
            if vect[i] == 1 and vect[i] == vect[i + 1]:
                upUp += 1
            elif vect[i] == 0 and vect[i] == vect[i + 1]:
                downDown += 1
            elif vect[i] == 1 and vect[i + 1] == 0:
                upDown += 1
            elif vect[i] == 0 and vect[i + 1] == 1:
                downUp += 1

        UU = upUp / numOfUps if numOfUps else 0
        DD = downDown / numOfDowns if numOfDowns else 0
        UD = upDown / numOfUps if numOfUps else 0
        DU = downUp / numOfDowns if numOfDowns else 0

        # Create transition matrix
        P = np.matrix([[UU, DU], [UD, DD]])
        print("\nTransition matrix: ", P ** self.n)

        eigenvalues, eigenvectors = np.linalg.eig(P)
        print("\nEigenvalues: \n", eigenvalues)
        print("\nEigenvectors: \n", eigenvectors)

        # Initial state distribution
        S0 = np.matrix([[1], [0]])

        # Calculate the state distribution after n days
        SOld = S0
        for _ in range(self.n):
            SNew = P * SOld
            SOld = SNew
        print("\n")
        return SNew

teslaEarningsDates = [
    "2024-04-23", "2024-01-24", "2023-10-18", "2023-07-19",
    "2023-04-19", "2023-01-25", "2022-10-19", "2022-07-20",
    "2022-04-20", "2022-01-26", "2021-10-20", "2021-07-26",
    "2021-04-26", "2021-01-27", "2020-10-21", "2020-07-22",
    "2020-04-29", "2020-01-29", "2019-10-23", "2019-07-24",
    "2019-04-24", "2019-01-30", "2018-10-24", "2018-08-01",
    "2018-05-02", "2018-02-07", "2017-11-01", "2017-08-02",
    "2017-05-03", "2017-02-22", "2016-10-26", "2016-08-03",
    "2016-05-04", "2016-02-10", "2015-11-03", "2015-08-05",
    "2015-05-06", "2015-02-11", "2014-11-05", "2014-07-31",
    "2014-05-07", "2014-02-19", "2013-11-05", "2013-08-07",
    "2013-05-08", "2013-02-20", "2012-11-05", "2012-08-03",
    "2012-05-09", "2012-02-15", "2011-11-02", "2011-08-03",
    "2011-05-04", "2011-02-15", "2010-11-10", "2010-08-04",
    "2010-05-11"
]

n = 250
analysis = StockAnalysis("TSLA", n, teslaEarningsDates)
P = analysis.findProb()
print(P)
