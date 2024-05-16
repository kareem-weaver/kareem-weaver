import numpy as np
from sympy import Matrix
import math

class Solution:
    char_to_num = {
        'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5,
        'G': 6, 'H': 7, 'I': 8, 'J': 9, 'K': 10, 'L': 11,
        'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17,
        'S': 18, 'T': 19, 'U': 20, 'V': 21, 'W': 22, 'X': 23,
        'Y': 24, 'Z': 25
    }

    num_to_char = {v: k for k, v in char_to_num.items()}
    
    def Encode(self, message, key):
        # Ensure message is uppercase and remove spaces
        message = message.replace(" ", "").upper()
        
        # add filler chars to string not multiple of 3
        while len(message)%3 !=0:
            message += "X"    
        print("Message:", message, "\n")

        # convert chars to numbers
        messageList = [self.char_to_num[char] for char in message]
        
        # Create message Matrix
        messageMatrix = Matrix([messageList[3*i:3*i+3] for i in range(int(len(message)//3))])
        messageMatrix = messageMatrix.T
        #print("Message as Matrix:\n", messageMatrix,"\n")
        #print("Key: \n", key, "\n")
        
        # Encode message
        keyMatrix = Matrix(key)
        encodedMatrix = Matrix(keyMatrix * messageMatrix)%26
        #print("Encoded Matrix:\n", encodedMatrix, "\n")
        
        # Flatten Matrix, convert numbers to chars
           
        encodedVector = encodedMatrix.T.tolist()
        encodedMessage = ''.join(self.num_to_char[num] for sublist in encodedVector for num in sublist)
        
        print("Encoded message: ", encodedMessage)
        
        
    def Decode(self, encodedMessage, key):
        print("Encoded message: ", encodedMessage, "\n")
        
        # Create key matrix and compute its modular inverse
        keyMatrix = Matrix(key)
        invKeyMatrix = keyMatrix.inv_mod(26)
        #print("Inverse key: \n", invKeyMatrix, "\n")
       
        # Convert chars to numbers
        encodedList = [self.char_to_num[char] for char in encodedMessage]
        
        # Create encoded message Matrix
        encodedMatrix = Matrix([encodedList[3*i:3*i+3] for i in range(int(len(encodedMessage)//3))])
        encodedMatrix = encodedMatrix.T

        # Decode Matrix
        decodedMatrix = Matrix(invKeyMatrix * encodedMatrix)%26
        #print("Decoded matrix: \n", decodedMatrix, "\n")
        
        # Flatten matrix and convert numbers to chars
        
        decodedVector = decodedMatrix.T.tolist()
        decodedMessage = ''.join(self.num_to_char[num] for sublist in decodedVector for num in sublist)
       
        print("Decoded message is: ", decodedMessage)
        
