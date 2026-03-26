import styles from './Privacy.module.css';

function Privacy() {
  const sections = [
    {
      title: '1. Ce date colectăm',
      body: 'Colectăm datele pe care ni le furnizezi direct atunci când creezi un cont sau trimiți o sesizare: nume, adresă de email, conținutul sesizării și fișierele încărcate.',
    },
    {
      title: '2. Cum folosim datele',
      body: 'Folosim informațiile exclusiv pentru funcționarea platformei: autentificare, procesarea sesizărilor, comunicare privind statusul cazurilor și îmbunătățirea serviciului.',
    },
    {
      title: '3. Partajarea datelor',
      body: 'Nu vindem datele personale. Datele sunt partajate doar cu furnizori tehnici necesari funcționării aplicației și cu autoritățile competente, atunci când este necesar pentru soluționarea sesizărilor.',
    },
    {
      title: '4. Drepturile tale',
      body: 'Poți solicita accesul, rectificarea sau ștergerea datelor tale, precum și restricționarea prelucrării.',
    },
    {
      title: '5. Securitatea datelor',
      body: 'Implementăm măsuri tehnice și organizaționale pentru protecția datelor, inclusiv control de acces, conexiuni securizate și monitorizarea infrastructurii.',
    },
  ];

  return (
    <section className={styles.privacyPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Politica de Confidențialitate</h1>
        <p className={styles.updated}>Ultima actualizare: 26 martie 2026</p>

        {sections.map((section) => (
          <div className={styles.card} key={section.title}>
            <h2 className={styles.cardTitle}>{section.title}</h2>
            <p className={styles.cardText}>{section.body}</p>
          </div>
        ))}

        <div className={styles.contactBox}>
          Pentru solicitări privind datele personale, scrie-ne la{' '}
          <a href="mailto:privacy@civic.ro">privacy@civic.ro</a>.
        </div>
      </div>
    </section>
  );
}

export default Privacy;
