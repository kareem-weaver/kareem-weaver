#include <iostream>
using namespace std; 
int main () {
    int guessIndex = 0;
    int answerIndex = 0;
    string answer = "HORSE";
    string guess;
    int guessNum = 0;
        
        cout <<"Guess a five letter word: ";
        cin >>guess;

    while (guess != answer && guessNum <= 5) {
        while (guessIndex <= 4 && guessNum <= 5) {
            if (guess[guessIndex] == answer[answerIndex]) {
                cout << guess[guessIndex] <<" is green\n";
            } else if ((guess[guessIndex] != answer[answerIndex]) && (guess[guessIndex] == answer[0] || guess[guessIndex] == answer[1] || guess[guessIndex] == answer[2] || guess[guessIndex] == answer[3] || guess[guessIndex] == answer[4])) {      
                cout << guess[guessIndex] <<" is yellow\n";
            } else if (guess[guessIndex] != answer[0] || guess[guessIndex] != answer[1] || guess[guessIndex] != answer[2] || guess[guessIndex] != answer[3] || guess[guessIndex] != answer[4]) {
                cout << guess[guessIndex] <<" is red" << endl;
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
    cout << "You guessed the word, " << answer <<endl;
    return 0;
}
