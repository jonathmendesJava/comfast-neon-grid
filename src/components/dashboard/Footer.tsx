export const Footer = () => {
  return (
    <footer className="w-full border-t border-border/50 bg-card/30 backdrop-blur-sm mt-12">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Desenvolvido por{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-semibold">
              Fios Tecnologia
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};