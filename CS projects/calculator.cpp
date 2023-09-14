#include <iostream>
using namespace std;

int main() {
    double firstNumber;
    double secondNumber;
    string operation;
    char again = 'Y';

    while (again == 'y' || again == 'Y') {

        cout <<"Enter the first number: ";
        cin >>firstNumber;
        cout <<"Enter the operation (+, -, *, /): ";
        cin >> operation;
        cout << "Enter the second number: ";
        cin >>secondNumber;

        while (operation != "+" && operation != "-" && operation != "*" && operation != "/") {
            cout <<"Error-Invalid operator.\n";
            cout <<"Re-enter operation: ";
            cin >> operation;
        } 
        while ((again == 'y' || again == 'Y') && (secondNumber == 0 && operation == "/")) {
            cout <<"Error-cannot divide by 0.\n";
            cout <<"Re-enter numbers(y/Y). Quit(n/N): ";
            cin >> again;
            cout <<"Enter the first number: ";
            cin >>firstNumber;
            cout <<"Enter the operation (+, -, *, /): ";
            cin >> operation;
            cout << "Enter the second number: ";
            cin >>secondNumber;
        } 

        if (operation == "+" && again == 'y' &&  again == 'Y') {
            cout <<"Result: " <<firstNumber + secondNumber <<endl;
        } else if (operation == "-") {
            cout <<"Result: " <<firstNumber - secondNumber <<endl;
        } else if (operation == "*") {
            cout <<"Result: "<<firstNumber * secondNumber <<endl;
        } else if (operation == "/") { 
            cout <<"Result: " <<firstNumber / secondNumber <<endl;
        } 
     
        if (again == 'y' || again == 'Y') {     
        } else if (again != 'y' && again != 'Y') {
            return 0;
        }
    }

}

