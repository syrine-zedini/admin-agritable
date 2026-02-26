type ActivityTabProps = {
  userId: string;
};

export default function ActivityTab({ userId }: ActivityTabProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Activity Log</h2>
      <p>Afficher le journal d'activité de l'utilisateur {userId}</p>
    </div>
  );
}
