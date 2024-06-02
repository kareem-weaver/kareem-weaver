import yfinance as yf
import numpy as np
import pandas as pd
from datetime import datetime

class StockAnalysis:
    def __init__(self, ticker, n):
        self.ticker = ticker
        self.n = n

    def findProb(self):
        stock = yf.Ticker(self.ticker)

        # Query all history prices
        stock = stock.history(period="max")

        # Keep only necessary columns
        stock = stock[["Open", "Close", "Low", "High", "Volume"]]

        # Calculate the target column
        stock["Tomorrow"] = stock["Close"].shift(-1)
        stock["Target"] = (stock["Tomorrow"] > stock["Close"]).astype(int)

        # Truncate the data at specified date
        stock_trun = stock.loc["2000-01-01":"2024-03-31"].copy()
        vect = np.array(stock_trun['Target'])


        # Count up and down days
        numOfUps = np.sum(vect)
        numOfDowns = len(vect) - numOfUps
        print("Up days:", numOfUps)
        print("Down days:", numOfDowns)
        print("\nRatio of up days:", numOfUps / len(vect))
        print("Ratio of down days:", numOfDowns / len(vect))


        # Checking cases for [[UU, DU],
        #                     [UD, DD]]
        # where 1 = up day and 0 = down day
        down = 0
        up = 0
        downDown = 0
        upUp = 0
        downUp = 0
        upDown = 0
        for i in range(len(vect) - 1):
            if vect[i] == 1 and vect[i] == vect[i+1]:
                upUp+=1

            elif vect[i] == 0 and vect[i] == vect[i+1]:
                downDown+=1

            elif vect[i] == 1 and vect[i+1] == 0:
                upDown+=1

            elif vect[i] == 0 and vect[i+1] == 1:
                downUp +=1

        UU = upUp/numOfUps
        DD = downDown/numOfDowns
        UD = upDown/numOfUps
        DU = downUp/numOfDowns

        # Create transition matrix
        P = np.matrix([[UU, DU],
                   [UD, DD]])
        print("\nTransition matrix: ", P ** self.n, "\n")


        eigenvalues, eigenvectors = np.linalg.eig(P)
        print("\nEigenvalues: \n", eigenvalues)
        print("\nEigenvectors: \n", eigenvectors)

        # Initial state distribution
        S0 = np.matrix([[1],
                       [0]])


        # Calculate the state distribution after n days
        SOld = S0
        for _ in range(self.n):
            SNew = (P * SOld)
            SOld = SNew

        print("\n")
        return SNew


### Example usage ###

# Number of days
n = 250

# Create an instance of the StockAnalysis class
analysis = StockAnalysis("tsla", n)

# Find the state distribution after n days
P = analysis.findProb()

print(P)
