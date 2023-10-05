#include <iostream>
#include <cstring>
using namespace std; 
int main () {
    int guessIndex = 0;
    int answerIndex = 0;
    string answer = "HORSE";
    string guess;
    int guessNum = 0;
        
    string red = "\033[1;31m";
    string green = "\033[1;32m";
    string yellow = "\033[1;33m";
    string reset = "\033[0m";

        cout <<"Guess a five letter word: ";
        cin >>guess;

    while (guess != answer && guessNum <= 5) {
        while (guessIndex <= 4 && guessNum <= 5) {
            if (guess[guessIndex] == answer[answerIndex]) {
                cout << green << guess[guessIndex] << reset << endl; //green
            } else if ((guess[guessIndex] != answer[answerIndex]) && (guess[guessIndex] == answer[0] || guess[guessIndex] == answer[1] || guess[guessIndex] == answer[2] || guess[guessIndex] == answer[3] || guess[guessIndex] == answer[4])) {      
                cout << yellow << guess[guessIndex] << reset << endl; //yellow
            } else if (guess[guessIndex] != answer[0] || guess[guessIndex] != answer[1] || guess[guessIndex] != answer[2] || guess[guessIndex] != answer[3] || guess[guessIndex] != answer[4]) {
                cout << red << guess[guessIndex] << reset << endl; //red
            }
            guessIndex = guessIndex + 1;
            answerIndex = answerIndex + 1;
        }
        guessNum = guessNum + 1;
        if (guess != answer && guessNum <= 5) {
            cout <<"Guess another five letter word: ";
            cin >>guess;
            guessIndex = 0;
            answerIndex = 0;
        }
    } 
    if (guessNum = 6 && guess != answer) {
        cout <<"You are out of guesses. The Answer was HORSE \n"; 
    } else if (guess == answer)  
    cout << "You guessed the word: " << green << answer << reset << "!" << endl;
    return 0;
}
