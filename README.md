# 🌱 Seedling Economy Simulator 🍒

[**➡️ Click here to try the live simulator! ⬅️**](https://value-chain-1i8468xyv-rahimjackass-projects.vercel.app/)

This interactive tool is designed to help game designers and economists balance the in-game economy for the upcoming MMO life simulation.

Our simulation scenario:

> 🌳🪓 A hungry Seedling walks to a tree, uses their trusty axe, and harvests some delicious cherries. What's the true cost of a single cherry after all that hard work? Let's find out! 👇

---

## The Core Formula

```
Final Price per Unit = ((Total Time × (Labor Rate + Sustenance Rate)) + Tool Cost) × Scarcity Multiplier / Units Harvested
```

---

### How the Formula Works ⚗️

The price of a single cherry isn't just a random number; it's the sum of all the tiny costs the Seedling incurs during the harvesting process. We calculate this by breaking down their effort into logical parts:

1.  **`Total Time Cost = Total Time × (Labor Rate + Sustenance Rate)`**

    - **What it is:** This is the cost associated with the _time_ spent on the task.
    - **Why it's like this:** A Seedling's time has value in two ways. First, they should earn a "wage" for their work (**Labor Rate**). Second, just by being alive, their needs (like hunger) are constantly decaying, which costs them money to fix (**Sustenance Rate**). This part of the formula calculates the total wages earned and the total "cost of living" during the entire time they are walking to the cherry tree and harvesting it.

2.  **`Tool Cost`**

    - **What it is:** The cost of the axe wearing down from one swing.
    - **Why it's like this:** Tools aren't free and they don't last forever. If a 50 SeedCoin axe breaks after 150 uses, then every single swing "spent" 0.33 SeedCoin of the axe's value. This part of the formula calculates that tiny cost of equipment depreciation for the single action of harvesting the cherries.

3.  **`Scarcity Multiplier`**

    - **What it is:** A bonus multiplier that makes rare things more valuable.
    - **Why it's like this:** An item's value isn't just about the effort to get it; it's also about supply and demand. If cherry trees are very rare in the world, the `Scarcity Multiplier` increases the final price to reflect that they are a luxury good.

4.  **`... / Units Harvested`**
    - **What it is:** The final step where we divide the total cost of the action by the number of cherries the Seedling gets.
    - **Why it's like this:** The formula first calculates the cost of the _entire event_. If that action costs 12 SeedCoin but gives the Seedling 3 cherries, then the true cost of each individual cherry is 12 / 3 = 4 SeedCoin. This gives us our final breakeven price.

---

### The Assumed Values (Your Dials & Knobs) 🎛️

To make the formula work, we have to make some foundational assumptions. In the simulator, these are the values you can change to see how they affect the final price:

- **Target Hourly Income:** The "minimum wage" you want a Seedling to earn. This sets the `Base Labor Rate`.
- **Price of one Axe & Number of uses:** These determine the `Tool Cost`.
- **Price of one loaf of Bread & Food restored by Bread:** These, along with the decay rate, determine the `Sustenance Rate` for the Food need.
- **Scarcity Multiplier:** The premium you want to add for rarity.

By adjusting these core values, you can balance the entire economy from the ground up.

Happy balancing! ⚖️
