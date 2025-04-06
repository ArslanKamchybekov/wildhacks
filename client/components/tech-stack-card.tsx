"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardShell } from "@/components/dashboard-shell";
import { useCurrentUser } from "@/hooks/use-current-user";
import { updateUser } from "@/app/actions/user";
import { DashboardHeader } from "@/components/dashboard-header";
import { UserConnections } from "@/components/user-connections";

// --- Stripe-related imports
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Load your Stripe publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

// -----------------------------------------
// Payment form for "Bet on Your Pet"
// (manual capture approach, no DB storage)
// -----------------------------------------
function ManualCaptureBetForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // We'll store the PaymentIntent ID in local state (for demonstration only!)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Step 1: Authorize (create PaymentIntent in manual capture mode)
  const handleAuthorize = async () => {
    if (!stripe || !elements) {
      setError("Stripe is not loaded yet.");
      return;
    }
    setIsAuthorizing(true);
    setError("");
    setSuccessMessage("");

    try {
      // 1) Create PaymentIntent on server (manual capture)
      const res = await fetch("/api/create-pet-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: betAmount }),
      });
      if (!res.ok) {
        throw new Error("Server error creating PaymentIntent");
      }
      const { clientSecret, paymentIntentId } = await res.json();
      if (!clientSecret || !paymentIntentId) {
        throw new Error(
          "Server did not return clientSecret or paymentIntentId"
        );
      }

      // 2) Confirm the payment with the user's card
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Check PaymentIntent status: should be "requires_capture"
      if (paymentIntent && paymentIntent.status === "requires_capture") {
        setPaymentIntentId(paymentIntentId);
        setSuccessMessage(
          "Payment authorized! (not yet charged). PaymentIntent ID stored in state."
        );
      } else {
        throw new Error(
          `Unexpected status: ${paymentIntent?.status}. Expected "requires_capture".`
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Step 2: Trigger "Pet Death" => capture the PaymentIntent
  const handlePetDeath = async () => {
    if (!paymentIntentId) {
      setError("No PaymentIntent ID in state. Authorize first!");
      return;
    }
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/capture-pet-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId }),
      });
      if (!res.ok) {
        throw new Error("Error capturing PaymentIntent on server");
      }
      const data = await res.json();
      if (!data.paymentIntent) {
        throw new Error("No paymentIntent object returned on capture");
      }

      setSuccessMessage(
        "Payment captured successfully! The user has been charged."
      );
      setPaymentIntentId(null); // Clear the ID after capture
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bet Amount */}
      <div className="space-y-2">
        <Label htmlFor="bet">Bet Amount (USD)</Label>
        <Input
          id="bet"
          type="number"
          min={1}
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
        />
      </div>

      {/* Card Element with styling */}
      <div className="p-3 border rounded-md">
        <CardElement
          options={{
            style: {
              base: {
                color: "#000", // set text color to black
                fontSize: "16px",
                "::placeholder": {
                  color: "#666", // placeholder color
                },
              },
              invalid: {
                color: "#9e2146", // red for invalid
              },
            },
          }}
        />
      </div>

      {/* Buttons */}
      <div className="flex space-x-2">
        <Button onClick={handleAuthorize} disabled={isAuthorizing || !stripe}>
          {isAuthorizing ? "Authorizing..." : "Authorize Payment"}
        </Button>
        <Button variant="destructive" onClick={handlePetDeath}>
          Trigger Pet Death (Capture Now)
        </Button>
      </div>

      {/* Error/Success messages */}
      {error && <p className="text-red-500">{error}</p>}
      {successMessage && <p className="text-green-500">{successMessage}</p>}
    </div>
  )
}

export default function SettingsPage() {
  const { dbUser, auth0User, isLoading } = useCurrentUser();
  const router = useRouter();

  // Profile State
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (dbUser) {
      setName(dbUser.name || "");
    }
  }, [dbUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser?._id) {
      toast.error("User information not available");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUser(dbUser._id, { name });
      toast.success("Profile updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }
  if (!auth0User || !dbUser) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground">
              Please sign in to view your settings
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push("/api/auth/login")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <DashboardHeader
          heading="Profile Settings"
          text="Update your account settings and profile information"
        />
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Update your personal information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={auth0User.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Your email address is managed by your authentication provider
                  and cannot be changed here.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>

        <UserConnections userId={dbUser._id} />

        {/* The new "Bet on Your Pet" Payment Card (manual capture demo) */}
        <Card>
          <CardHeader>
            <CardTitle>Bet on Your Pet (Manual Capture)</CardTitle>
            <CardDescription>
              Authorize the amount now, then capture later when "Pet Death" is
              triggered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Wrap the payment form in <Elements> so CardElement can function */}
            <Elements stripe={stripePromise}>
              <ManualCaptureBetForm />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
