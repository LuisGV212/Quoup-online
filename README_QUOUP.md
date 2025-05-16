# Quoup - Company-Themed Digital Card Game

## Project Overview
A React-based multiplayer card game that reimagines the game "Coup" with a tech company theme. Built for web deployment, using real-time communication.

## Core Game Rules

### Game Setup
- Players start with:
  - 2 privilege roles (face-down)
  - 2 reports (currency)
- Win condition: Be the last player with privileges
- Maximum tokens: 10 (must use Delete User if exceeded)

### Available Actions

#### Universal Actions
1. **Basic Access**
   - Gain 1 token
   - Cannot be blocked or challenged
   - No cost

2. **Guest Access**
   - Gain 2 tokens
   - Can be blocked by Admin
   - No cost
   - Can be challenged
   - **Penalty:** Lose 2 tokens if blocked

3. **Delete User**
   - Cost: 7 tokens
   - Effect: Remove one privilege from target
   - Cannot be blocked
   - Cannot be challenged
   - **Penalty:** Lose 7 tokens if blocked

### Character Roles

1. **Admin** (Duke equivalent)
   ```
   Action: Gain 3 tokens (Collect Tokens)
   Block: Can block Guest Access
   Cost: 0 tokens
   Can be Challenged: Yes
   ```

2. **System Admin** (Assassin equivalent)
   ```
   Action: Deactivate a user's privilege
   Block: None
   Cost: 3 tokens
   Requirements: Valid target
   Can be Blocked: Yes (by Root User)
   Can be Challenged: Yes
   Penalty: Lose 3 tokens if blocked
   ```

3. **PM** (Captain equivalent)
   ```
   Action: Transfer 2 tokens from another user
   Block: Can prevent token transfers
   Cost: 0 tokens
   Requirements: Target must have 2+ tokens
   Can be Blocked: Yes (by PM or Contractor)
   Can be Challenged: Yes
   ```

4. **Contractor** (Ambassador equivalent)
   ```
   Action: Exchange roles with the system
   Block: Can prevent token transfers
   Cost: 0 tokens
   Requirements: At least one unrevealed privilege
   Can be Challenged: Yes
   ```

5. **Root User** (Contessa equivalent)
   ```
   Action: None
   Block: Can prevent user deactivation
   Requirements: None
   Can be Challenged: Yes (when blocking)
   ```

## Key Game Mechanics

### Token Management
- Tokens are the game's currency
- Maximum: 10 tokens (must Delete User if exceeded)
- Token costs are deducted when action succeeds
- Tokens are lost when actions are blocked (as a penalty)
- Tokens are refunded on successful challenges

### Blocking System
- Specific roles can block certain actions
- Blocking can be challenged
- Blocking prevents action and causes the player to lose tokens
- 5-second window for blocking/challenging
- Visual notifications when actions are blocked

### Challenge System
- Any action claiming a role can be challenged
- Failed challenger loses a privilege
- Successful challenger causes action performer to lose privilege
- Tokens are refunded on successful challenges
- Game checks for winner after each privilege loss

### Turn Structure
1. Active Player's Turn:
   - Player selects one action
   - Token costs are reserved but not deducted yet
   - Action enters blocking window if applicable

2. Blocking Window (5 seconds):
   - Other players may block or challenge
   - If blocked, action is cancelled and tokens are lost as penalty
   - If challenged, proceed to challenge resolution

3. Challenge Resolution:
   - Failed challenges lose a privilege
   - Successful challenges prevent action and refund tokens
   - Game checks for winner after privilege loss

4. Action Resolution:
   - If not blocked/challenged, action executes
   - Token costs are deducted
   - Game state updates
   - Move to next player's turn
