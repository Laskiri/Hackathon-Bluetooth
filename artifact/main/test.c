#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"

#define STATUS_LED_GPIO 2



void app_main(void)
{
    printf("Hello, World!\n");
	    // Initialize the LED pin
    gpio_reset_pin(STATUS_LED_GPIO);
    gpio_set_direction(STATUS_LED_GPIO, GPIO_MODE_OUTPUT);

    while (1) {
        gpio_set_level(STATUS_LED_GPIO, 1); // LED ON
        vTaskDelay(500 / portTICK_PERIOD_MS);

        gpio_set_level(STATUS_LED_GPIO, 0); // LED OFF
        vTaskDelay(500 / portTICK_PERIOD_MS);
    }
    while (1) {
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}
