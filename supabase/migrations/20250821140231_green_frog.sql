/*
  # ZAR Stablecoin App Database Schema

  1. New Tables
    - `profiles` - User profile information
    - `wallets` - User wallet balances
    - `transactions` - Transaction history
    - `charges` - Payment requests/charges
    - `bank_accounts` - User bank account information

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for system operations

  3. Functions
    - `update_wallet_balance` - Safely update wallet balances
    - `handle_new_user` - Create wallet when user registers
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  firstName text NOT NULL,
  lastName text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  balance decimal(15,2) DEFAULT 0.00 NOT NULL,
  currency text DEFAULT 'LZAR' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, currency)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  amount decimal(15,2) NOT NULL,
  currency text DEFAULT 'LZAR' NOT NULL,
  type text NOT NULL CHECK (type IN ('transfer', 'mint', 'redeem', 'payment', 'reward')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description text,
  external_id text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create charges table
CREATE TABLE IF NOT EXISTS charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  payment_id text NOT NULL,
  amount decimal(15,2) NOT NULL,
  currency text DEFAULT 'LZAR' NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paid', 'expired', 'failed')),
  description text,
  external_id text,
  payer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_holder text NOT NULL,
  account_number text NOT NULL,
  branch_code text NOT NULL,
  bank text NOT NULL,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Wallets policies
CREATE POLICY "Users can read own wallet"
  ON wallets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage wallets"
  ON wallets
  FOR ALL
  TO service_role;

-- Transactions policies
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "System can manage transactions"
  ON transactions
  FOR ALL
  TO service_role;

-- Charges policies
CREATE POLICY "Users can read own charges"
  ON charges
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR payer_id = auth.uid());

CREATE POLICY "Users can create charges"
  ON charges
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can manage charges"
  ON charges
  FOR ALL
  TO service_role;

-- Bank accounts policies
CREATE POLICY "Users can manage own bank accounts"
  ON bank_accounts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sender_id ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recipient_id ON transactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_charges_user_id ON charges(user_id);
CREATE INDEX IF NOT EXISTS idx_charges_payment_id ON charges(payment_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);

-- Function to safely update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance(user_id uuid, amount decimal)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, currency)
  VALUES (user_id, amount, 'LZAR')
  ON CONFLICT (user_id, currency)
  DO UPDATE SET 
    balance = wallets.balance + amount,
    updated_at = now()
  WHERE wallets.balance + amount >= 0;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance or invalid user';
  END IF;
END;
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create wallet for new user
  INSERT INTO wallets (user_id, balance, currency)
  VALUES (NEW.id, 0.00, 'LZAR');
  
  RETURN NEW;
END;
$$;

-- Trigger to create wallet when profile is created
CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_charges_updated_at
  BEFORE UPDATE ON charges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();