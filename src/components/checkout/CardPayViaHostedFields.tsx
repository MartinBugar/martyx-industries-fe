import {
  PayPalHostedFieldsProvider,
  PayPalHostedField,
  usePayPalHostedFields
} from "@paypal/react-paypal-js";
import * as React from "react";
import './CardPayViaHostedFields.css';

type Props = {
  createOrder: () => Promise<string>;                 // pouzij tvoju existujucu createOrder
  onApproveCapture: (orderId: string) => Promise<void>; // zavola tvoj /capture-order
};

export default function CardPayViaHostedFields({ createOrder, onApproveCapture }: Props) {
  // (volitelne) skontroluj eligibility; ak nie je, komponent mozes skryt/nezobrazit
  const eligible =
    typeof window !== "undefined" &&
    (window as any)?.paypal?.HostedFields?.isEligible?.() === true;

  if (!eligible) return null; // nechaj prazdne alebo zobraz info, ze karta docasne nie je dostupna

  return (
    <div className="card-hosted-fields-container">
      <PayPalHostedFieldsProvider
        createOrder={createOrder}
        styles={{
          input: {
            backgroundColor: "#10161d",
            color: "#e7eef5",
            fontSize: "16px",
            padding: "12px 14px",
            border: "1px solid #232b34",
            borderRadius: "12px"
          },
          ":focus": { outline: "none", borderColor: "#28c1ff" },
          "::placeholder": { color: "#7f8b98" },
          ".invalid": { color: "#ff6b6b", borderColor: "#ff6b6b" }
        }}
      >
        <div className="card-fields-grid">
          <div className="card-field">
            <label className="card-field-label">Cislo karty</label>
            <PayPalHostedField
              id="card-number"
              hostedFieldType="number"
              options={{ placeholder: "4111 1111 1111 1111" }}
            />
          </div>

          <div className="card-fields-row">
            <div className="card-field">
              <label className="card-field-label">Platnost</label>
              <PayPalHostedField
                id="expiration-date"
                hostedFieldType="expirationDate"
                options={{ placeholder: "MM/YY" }}
              />
            </div>
            <div className="card-field">
              <label className="card-field-label">CVV</label>
              <PayPalHostedField
                id="cvv"
                hostedFieldType="cvv"
                options={{ placeholder: "123" }}
              />
            </div>
          </div>

          <HostedSubmitButton onApproveCapture={onApproveCapture} />
        </div>

        <p className="card-security-note">
          Platba kartou je spracovana bezpecne cez PayPal.
        </p>
      </PayPalHostedFieldsProvider>
    </div>
  );
}

function HostedSubmitButton({ onApproveCapture }: { onApproveCapture: (orderId: string) => Promise<void> }) {
  const { cardFields } = usePayPalHostedFields();

  const onClick = async () => {
    if (!cardFields) return;
    const { orderId } = await cardFields.submit({ contingencies: ["3D_SECURE"] }) as { orderId: string };
    await onApproveCapture(orderId);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="card-submit-button"
    >
      Zaplatit kartou
    </button>
  );
}