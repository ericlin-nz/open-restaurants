# open-restaurants

## Description

This exercise is for reading a JSON file that contains data about restaurant opening times, and creating a method for obtaining the list of all restaurants that are open at a certain point in time of the week.

This exercise makes the following assumptions:

- Date and times are in the same time zone
- All of the data in `restaurant_data.json` are valid and correct

## Setup

To start and test this application, simply run the following commands in a terminal:

```
git clone https://github.com/lin-eric/open-restaurants.git
cd open-restaurants/
npm install
npm run test
```

# Details

## Solution

This solution follows the following steps:

### Data Processing

- Read the raw JSON data
- Convert the opening times data into a format that can be easily used to run comparisons on. In this case, I used seconds since the start of Monday, 12:00 am.
- Between each opening day, create an interval between, and including those days.
- Within each interval, narrow that down to the start end and end times.
- Store these intervals against each restaurant.

### Input

- The user specifies an input time
- The time specified is converted into seconds to match the intervals set in the data processing step
- The application goes through each restaurant and each opening time and compares whether or not the specified time is between the start and end time of each interval.

The two parts have been separated into two main classes:

- `Restaurants.ts` - acts as the entry point to the application. This handles the user input to identify the intersections with each interval.
- `Schedule.ts` - handles the processing of the raw JSON data into a consumable format.

### Analysis

This solution was chosen due to the ease of implementation where we simply need to go through each restaurant in the list and identify whether or not each opening time has an intersection with the input time. This solution however, scales poorly as the time it takes to go through the list scales linearly with the number of opening times.

Ideally, we would use an interval tree to hold the processed data structure. We can then traverse the tree structure looking only at nodes that have potential child nodes (and so on) that have an overlapping interval, and cancelling going through any nodes that do not.

The data structure would then be updated from:

```
type RestaurantIntervals = {
  name: string;
  intervals: Interval[];
}
```

to

```
type Node = {
  name: string;
  start: number;
  end: number;
  max_end: number;
  nodes: Node[];
}
```

... where `max_end` is the maximum `end` value that any child node or itself can contain.

For understanding how the `max_end` value would be used to compare against a specified input time, please see: https://en.wikipedia.org/wiki/Interval_tree#Augmented_tree
