#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define USER_ID "JPoiPBuSeHY7PPWoWAWs5hsxD2G3"
#define MAX_DESC_LEN 30

const char* categories[] = {
    "Food", "Transportation", "Utilities", "Entertainment",
    "Shopping", "Healthcare", "Education", "Other"
}; // Rent handled separately

const char* paymentMethods[] = {"cash", "bkash"};

int daysInMonth(int month, int year) {
    if (month == 2)
        return (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)) ? 29 : 28;
    else if (month == 4 || month == 6 || month == 9 || month == 11)
        return 30;
    else
        return 31;
}

void randomString(char *str, size_t length) {
    static const char charset[] = "abcdefghijklmnopqrstuvwxyz ";
    for (size_t i = 0; i < length - 1; ++i) {
        str[i] = charset[rand() % (sizeof(charset) - 1)];
    }
    str[length - 1] = '\0';
}

int main() {
    srand(time(NULL));

    int year, month;
    printf("Enter year (e.g., 2025): ");
    scanf("%d", &year);
    printf("Enter month (1-12): ");
    scanf("%d", &month);

    int days = daysInMonth(month, year);
    int rentDay = 5 + rand() % 6;  // between 5 and 10

    // Print header
    printf("amount;category;date;description;paymentMethod;userId\n");

    for (int day = 1; day <= days; day++) {
        int recordsPerDay = 1 + rand() % 5;  // 1 to 5 records per day

        for (int i = 0; i < recordsPerDay; i++) {
            int amount;
            const char *category;

            if (day == rentDay && i == 0) {
                category = "Rent";
                amount = 10000;  // Fixed rent amount
            } else {
                category = categories[rand() % (sizeof(categories) / sizeof(categories[0]))];

                // Skewed distribution: more small amounts, fewer large ones
                int maxAmount = 2000;
                float r = (float)rand() / RAND_MAX;
                amount = 10 + (int)(r * r * (maxAmount - 10));  // Quadratic bias
            }

            char date[11];
            snprintf(date, sizeof(date), "%04d-%02d-%02d", year, month, day);

            const char *paymentMethod = paymentMethods[rand() % 2];

            char description[MAX_DESC_LEN];
            randomString(description, MAX_DESC_LEN);

            // Output semicolon-separated values
            printf("%d;%s;%s;%s;%s;%s\n",
                   amount, category, date, description, paymentMethod, USER_ID);
        }
    }

    return 0;
}
